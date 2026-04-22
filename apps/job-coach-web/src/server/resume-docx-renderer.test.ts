import { describe, expect, it } from "vitest";
import { renderResumeDocx } from "./resume-docx-renderer";

describe("renderResumeDocx", () => {
    it("returns a docx export result", async () => {
        const result = await renderResumeDocx({
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

        expect(result.fileName).toBe("resume.docx");
        expect(result.mimeType).toBe(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        expect(result.buffer.byteLength).toBeGreaterThan(0);
    });
});