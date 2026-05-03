import { describe, expect, it } from "vitest";
import { renderApplicationPacketPdf } from "./application-packet-pdf-renderer";

describe("renderApplicationPacketPdf", () => {
  it("returns a pdf export result", async () => {
    const result = await renderApplicationPacketPdf({
      coverLetter: {
        content: "Dear Hiring Manager,\n\nThanks for your time.",
      },
      resume: {
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

    expect(result.fileName).toBe("application-packet.pdf");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.buffer.byteLength).toBeGreaterThan(100);

    const text = new TextDecoder().decode(new Uint8Array(result.buffer));
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
  });
});
