import { renderSimplePdf } from "./simple-pdf";

export async function renderCoverLetterPdf(input: {
    content: string;
}) {
    const lines = input.content.split("\n");

    return renderSimplePdf({
        title: "Cover Letter",
        lines,
        fileName: "cover-letter.pdf",
    });
}