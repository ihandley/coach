export async function renderResumePdf(_input: {
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
    return {
        fileName: "resume.pdf",
        mimeType: "application/pdf",
        buffer: new Uint8Array([1]).buffer,
    };
}