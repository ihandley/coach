import { describe, expect, it } from "vitest";
import { renderResumePdf } from "./resume-pdf-renderer";

describe("renderResumePdf", () => {
    it("returns a pdf export result", async () => {
        const result = await renderResumePdf({
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
            content: {
                name: "Jane Doe",
                headline: "Senior Software Engineer",
                summary: "Builds reliable product systems.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built APIs", "Improved reliability"],
                    },
                ],
            },
        });

        expect(result.fileName).toBe("resume.pdf");
        expect(result.mimeType).toBe("application/pdf");
        expect(result.buffer.byteLength).toBeGreaterThan(0);
    });
});