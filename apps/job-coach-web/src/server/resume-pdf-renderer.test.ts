import { describe, expect, it } from "vitest";
import { renderResumePdf } from "./resume-pdf-renderer";

describe("renderResumePdf", () => {
  it("returns a pdf export result", async () => {
    const result = await renderResumePdf({
      resumeProfileId: "rp1",
      resumeVersionId: "rv1",
      content: {
        name: "Jane Doe",
        headline: "Software Engineer",
        summary: "Builds useful software.",
        experience: [
          {
            company: "Acme",
            title: "Engineer",
            bullets: ["Built systems", "Improved reliability"],
          },
        ],
      },
    });

    expect(result.fileName).toBe("resume.pdf");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.buffer.byteLength).toBeGreaterThan(100);

    const text = new TextDecoder().decode(new Uint8Array(result.buffer));
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
  });
});
