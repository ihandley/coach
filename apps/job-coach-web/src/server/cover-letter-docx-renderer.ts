import { Document, Packer, Paragraph, TextRun } from "docx";

export async function renderCoverLetterDocx(input: {
    content: string;
}) {
    const paragraphs = input.content.split("\n").map(
        (line) =>
            new Paragraph({
                children: [new TextRun(line)],
            }),
    );

    const doc = new Document({
        sections: [{ children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(doc);
    const output = new Uint8Array(buffer);

    return {
        fileName: "cover-letter.docx",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: output.buffer.slice(
            output.byteOffset,
            output.byteOffset + output.byteLength,
        ) as ArrayBuffer,
    };
}