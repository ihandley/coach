import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    PageBreak,
} from "docx";

export async function renderApplicationPacketDocx(input: {
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
    const paragraphs: Paragraph[] = [
        new Paragraph({
            text: "Cover Letter",
            heading: HeadingLevel.TITLE,
        }),
    ];

    for (const line of input.coverLetter.content.split("\n")) {
        paragraphs.push(
            new Paragraph({
                children: [new TextRun(line)],
            }),
        );
    }

    paragraphs.push(
        new Paragraph({
            children: [new PageBreak()],
        }),
        new Paragraph({
            text: input.resume.name,
            heading: HeadingLevel.TITLE,
        }),
    );

    if (input.resume.headline) {
        paragraphs.push(
            new Paragraph({
                children: [new TextRun(input.resume.headline)],
            }),
        );
    }

    if (input.resume.summary) {
        paragraphs.push(
            new Paragraph({
                text: "Summary",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [new TextRun(input.resume.summary)],
            }),
        );
    }

    if (input.resume.experience?.length) {
        paragraphs.push(
            new Paragraph({
                text: "Experience",
                heading: HeadingLevel.HEADING_1,
            }),
        );

        for (const item of input.resume.experience) {
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
    const output = new Uint8Array(buffer);

    return {
        fileName: "application-packet.docx",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: output.buffer.slice(
            output.byteOffset,
            output.byteOffset + output.byteLength,
        ) as ArrayBuffer,
    };
}