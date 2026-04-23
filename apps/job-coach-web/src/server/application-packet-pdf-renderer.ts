import { renderSimplePdf } from "./simple-pdf";

export async function renderApplicationPacketPdf(input: {
    resume: {
        name: string;
        headline?: string;
        summary?: string;
        experience?: Array<{
            company: string;
            title: string;
            bullets: string[];
        }>;
    };
    coverLetter: {
        content: string;
    };
}) {
    const lines: string[] = ["Cover Letter", ""];

    lines.push(...input.coverLetter.content.split("\n"));
    lines.push("", "", "Resume", input.resume.name);

    if (input.resume.headline) {
        lines.push(input.resume.headline);
    }

    if (input.resume.summary) {
        lines.push("", "Summary", input.resume.summary);
    }

    if (input.resume.experience?.length) {
        lines.push("", "Experience");

        for (const item of input.resume.experience) {
            lines.push(`${item.title} - ${item.company}`);

            for (const bullet of item.bullets) {
                lines.push(`- ${bullet}`);
            }

            lines.push("");
        }
    }

    return renderSimplePdf({
        title: "Application Packet",
        lines,
        fileName: "application-packet.pdf",
    });
}