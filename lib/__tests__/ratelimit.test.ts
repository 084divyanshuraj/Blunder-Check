import { describe, it, expect, beforeEach } from "vitest";
import { SlidingWindowRateLimiter, getClientIp, checkApiRateLimit } from "../ratelimit";

describe("SlidingWindowRateLimiter", () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 1000, // 1 second for fast testing
      maxRequests: 3,
    });
  });

  it("allows requests up to the max limit", () => {
    const t0 = 100000;
    const r1 = limiter.check("1.2.3.4", t0);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("1.2.3.4", t0 + 100);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("1.2.3.4", t0 + 200);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the max limit within the window", () => {
    const t0 = 100000;
    limiter.check("1.2.3.4", t0);
    limiter.check("1.2.3.4", t0 + 100);
    limiter.check("1.2.3.4", t0 + 200);

    const blocked = limiter.check("1.2.3.4", t0 + 300);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("resets capacity as timestamps expire past the window", () => {
    const t0 = 100000;
    limiter.check("1.2.3.4", t0);
    limiter.check("1.2.3.4", t0 + 100);
    limiter.check("1.2.3.4", t0 + 200);

    // After 1050ms, the first request at t0 has expired
    const rAfter = limiter.check("1.2.3.4", t0 + 1050);
    expect(rAfter.allowed).toBe(true);
    expect(rAfter.remaining).toBe(0); // now has t0+100, t0+200, t0+1050
  });

  it("isolates different IP addresses", () => {
    const t0 = 100000;
    limiter.check("1.1.1.1", t0);
    limiter.check("1.1.1.1", t0 + 100);
    limiter.check("1.1.1.1", t0 + 200);

    const blockedIp1 = limiter.check("1.1.1.1", t0 + 300);
    expect(blockedIp1.allowed).toBe(false);

    // Different IP should still be allowed
    const allowedIp2 = limiter.check("2.2.2.2", t0 + 300);
    expect(allowedIp2.allowed).toBe(true);
    expect(allowedIp2.remaining).toBe(2);
  });
});

describe("getClientIp", () => {
  it("extracts the first IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("extracts from x-real-ip when x-forwarded-for is missing", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    expect(getClientIp(req)).toBe("198.51.100.4");
  });

  it("defaults to 127.0.0.1 when no proxy headers exist", () => {
    const req = new Request("http://localhost/api/test");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});

describe("checkApiRateLimit helper", () => {
  it("returns null when request is allowed, and 429 response when blocked", () => {
    const testLimiter = new SlidingWindowRateLimiter({
      windowMs: 5000,
      maxRequests: 1,
    });

    const req = new Request("http://localhost/api/checklist", {
      headers: { "x-forwarded-for": "10.20.30.40" },
    });

    const pass = checkApiRateLimit(req, testLimiter);
    expect(pass).toBeNull();

    const blocked = checkApiRateLimit(req, testLimiter);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBeDefined();
  });
});
