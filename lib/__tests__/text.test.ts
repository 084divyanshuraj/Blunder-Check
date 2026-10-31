import { describe, expect, it } from "vitest";
import { cleanText, titleFromText, truncateToLimit } from "../text";

describe("lib/text.ts", () => {
  it("cleans markdown images, links, javascript, and excessive newlines", () => {
    const raw = `Title: Example Page
URL Source: https://example.com
Markdown Content:

# Main Header

Here is an image: ![Scholarship Banner](https://example.com/img.png)
And a link: [Official Guidelines](https://example.com/guide.pdf).

Click here: javascript:alert(1)


There are many newlines above.`;

    const cleaned = cleanText(raw);
    expect(cleaned).not.toContain("![Scholarship Banner]");
    expect(cleaned).toContain("Official Guidelines");
    expect(cleaned).not.toContain("https://example.com/guide.pdf");
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).not.toContain("URL Source:");
    expect(cleaned).not.toContain("\n\n\n");
    expect(cleaned).toContain("# Main Header");
  });

  it("truncates text when exceeding max limit", () => {
    const shortText = "Short text";
    expect(truncateToLimit(shortText, 20)).toEqual({
      text: "Short text",
      truncated: false,
    });

    const longText = "12345678901234567890";
    expect(truncateToLimit(longText, 10)).toEqual({
      text: "1234567890",
      truncated: true,
    });
  });

  it("extracts title from Jina header, markdown header, or fallback", () => {
    const jinaHeader = "Title: Aurora Scholarship 2026\nSome body text";
    expect(titleFromText(jinaHeader)).toBe("Aurora Scholarship 2026");

    const mdHeader = "# University Admissions Policy\nSome rules...";
    expect(titleFromText(mdHeader)).toBe("University Admissions Policy");

    const plain = "Simple announcement\nDetails follow";
    expect(titleFromText(plain)).toBe("Simple announcement");

    expect(titleFromText("", "Default")).toBe("Default");
  });
});

