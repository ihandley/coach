import { describe, expect, it } from "vitest";
import { renderApplicationPacketDocx } from "./application-packet-docx-renderer";

describe("renderApplicationPacketDocx", () => {
  it("returns a docx export result", async () => {
    const result = await renderApplicationPacketDocx({
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

    expect(result.fileName).toBe("application-packet.docx");
    expect(result.mimeType).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(result.buffer.byteLength).toBeGreaterThan(100);
  });
});
