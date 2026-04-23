import { renderSimplePdf } from "./simple-pdf";

export async function renderResumePdf(input: {
    resumeProfileId: string;
    resumeVersionId: string;
    content: {
        name: string;
        headline?: string;
        summary?: string;
        experience?: Array<{
            company: string;
            title: string;
            bullets: string[];
        }>;
    };
}) {
    const lines: string[] = [input.content.name];

    if (input.content.headline) {
        lines.push(input.content.headline, "");
    }

    if (input.content.summary) {
        lines.push("Summary", input.content.summary, "");
    }

    if (input.content.experience?.length) {
        lines.push("Experience");

        for (const item of input.content.experience) {
            lines.push(`${item.title} - ${item.company}`);

            for (const bullet of item.bullets) {
                lines.push(`- ${bullet}`);
            }

            lines.push("");
        }
    }

    return renderSimplePdf({
        title: input.content.name,
        lines,
        fileName: "resume.pdf",
    });
}