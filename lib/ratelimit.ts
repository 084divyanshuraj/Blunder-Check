import { NextResponse } from "next/server";
import { LIMITS } from "../schemas/limits";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetTimestamp: number;
};

export type RateLimiterOptions = {
  windowMs: number;
  maxRequests: number;
};

/**
 * In-memory sliding-window rate limiter for serverless environments.
 * Tracks request timestamps per client IP.
 */
export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Evaluates if a request from this identifier is allowed under the sliding window.
   */
  check(identifier: string, now: number = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;

    // Retrieve or initialize timestamp history
    let timestamps = this.requests.get(identifier);
    if (!timestamps) {
      timestamps = [];
      this.requests.set(identifier, timestamps);
    }

    // Filter out timestamps outside the active sliding window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    // Housekeeping: prevent unbounded map growth
    if (this.requests.size > 5000) {
      this.purgeExpired(windowStart);
    }

    if (validTimestamps.length >= this.maxRequests) {
      const oldestValid = validTimestamps[0];
      const resetTimestamp = oldestValid + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimestamp - now) / 1000));

      this.requests.set(identifier, validTimestamps);

      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        retryAfterSeconds,
        resetTimestamp,
      };
    }

    // Record the current timestamp
    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);

    const remaining = this.maxRequests - validTimestamps.length;
    const resetTimestamp = now + this.windowMs;

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining,
      retryAfterSeconds: 0,
      resetTimestamp,
    };
  }

  /**
   * Resets stored history (useful in tests).
   */
  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }

  private purgeExpired(windowStart: number): void {
    for (const [key, ts] of this.requests.entries()) {
      const active = ts.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
  }
}

/**
 * Extracts client IP from standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  return "127.0.0.1";
}

/** Global shared instance configured with LIMITS */
export const defaultRateLimiter = new SlidingWindowRateLimiter({
  windowMs: LIMITS.RATE_LIMIT_WINDOW_MS,
  maxRequests: LIMITS.RATE_LIMIT_MAX_REQUESTS,
});

/**
 * Convenience helper to check request rate limit and return 429 response if exceeded.
 */
export function checkApiRateLimit(req: Request, limiter: SlidingWindowRateLimiter = defaultRateLimiter): NextResponse | null {
  const ip = getClientIp(req);
  const result = limiter.check(ip);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: `Too many requests. Please wait ${result.retryAfterSeconds} second(s) before trying again.`,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetTimestamp),
        },
      }
    );
  }

  return null;
}
