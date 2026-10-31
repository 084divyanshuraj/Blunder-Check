import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafeUrl, fetchViaJina } from "../jina";

describe("lib/jina.ts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("assertSafeUrl", () => {
    it("allows valid public http and https urls", () => {
      expect(assertSafeUrl("https://example.com/scholarships").hostname).toBe("example.com");
      expect(assertSafeUrl("http://portal.university.edu").hostname).toBe("portal.university.edu");
    });

    it("rejects non-http protocols", () => {
      expect(() => assertSafeUrl("ftp://files.example.com")).toThrow("Only http and https");
      expect(() => assertSafeUrl("javascript:alert(1)")).toThrow("Only http and https");
      expect(() => assertSafeUrl("file:///etc/passwd")).toThrow("Only http and https");
    });

    it("rejects localhost and local domains", () => {
      expect(() => assertSafeUrl("http://localhost:3000")).toThrow("Local and internal hostnames");
      expect(() => assertSafeUrl("https://my-service.local")).toThrow("Local and internal hostnames");
      expect(() => assertSafeUrl("http://dev.internal")).toThrow("Local and internal hostnames");
    });

    it("rejects loopback and private IPv4 addresses", () => {
      expect(() => assertSafeUrl("http://127.0.0.1:8080")).toThrow("Private and loopback");
      expect(() => assertSafeUrl("http://10.0.0.5")).toThrow("Private and loopback");
      expect(() => assertSafeUrl("http://192.168.1.100")).toThrow("Private and loopback");
      expect(() => assertSafeUrl("http://172.16.5.1")).toThrow("Private and loopback");
      expect(() => assertSafeUrl("http://169.254.1.1")).toThrow("Private and loopback");
    });

    it("rejects loopback IPv6 addresses", () => {
      expect(() => assertSafeUrl("http://[::1]:8080")).toThrow("Private and loopback");
      expect(() => assertSafeUrl("http://[fe80::1]")).toThrow("Private and loopback");
    });
  });

  describe("fetchViaJina", () => {
    it("fetches, cleans text and extracts title", async () => {
      const mockResponseText = `Title: Official Scholarship Portal\nURL Source: https://scholarship.org\nMarkdown Content:\n# Requirements\n\nMust have 85% aggregate marks to qualify for the grant.`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockResponseText),
      });

      const res = await fetchViaJina("https://scholarship.org");
      expect(res.title).toBe("Official Scholarship Portal");
      expect(res.text).toContain("Must have 85% aggregate marks");
      expect(res.text).not.toContain("URL Source:");
    });

    it("throws when extracted text is too short", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("Too short"),
      });

      await expect(fetchViaJina("https://empty.org")).rejects.toThrow("too little readable content");
    });
  });
});

