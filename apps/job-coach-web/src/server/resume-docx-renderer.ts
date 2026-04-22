import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
} from "docx";

export async function renderResumeDocx(input: {
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
    const paragraphs: Paragraph[] = [
        new Paragraph({
            text: input.content.name,
            heading: HeadingLevel.TITLE,
        }),
    ];

    if (input.content.headline) {
        paragraphs.push(
            new Paragraph({
                children: [new TextRun(input.content.headline)],
            }),
        );
    }

    if (input.content.summary) {
        paragraphs.push(
            new Paragraph({
                text: "Summary",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [new TextRun(input.content.summary)],
            }),
        );
    }

    if (input.content.experience?.length) {
        paragraphs.push(
            new Paragraph({
                text: "Experience",
                heading: HeadingLevel.HEADING_1,
            }),
        );

        for (const item of input.content.experience) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: item.title, bold: true }),
                        new TextRun(` — ${item.company}`),
                    ],
                }),
            );

            for (const bullet of item.bullets) {
                paragraphs.push(
                    new Paragraph({
                        text: bullet,
                        bullet: { level: 0 },
                    }),
                );
            }
        }
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);

    return {
        fileName: "resume.docx",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
        ),
    };
}