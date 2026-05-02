import {
    createCoverLetterDraft,
    InMemoryCoverLetterDraftRepository,
} from "@coach/core";

interface CreateCoverLetterDraftBody {
    jobId: string;
    candidateName: string;
    companyName: string;
    jobTitle: string;
    jobSummary: string;
    resumeSummary: string;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function parseBody(value: unknown): CreateCoverLetterDraftBody | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const body = value as Record<string, unknown>;

    if (
        !isNonEmptyString(body.jobId) ||
        !isNonEmptyString(body.candidateName) ||
        !isNonEmptyString(body.companyName) ||
        !isNonEmptyString(body.jobTitle) ||
        !isNonEmptyString(body.jobSummary) ||
        !isNonEmptyString(body.resumeSummary)
    ) {
        return null;
    }

    return {
        jobId: body.jobId,
        candidateName: body.candidateName,
        companyName: body.companyName,
        jobTitle: body.jobTitle,
        jobSummary: body.jobSummary,
        resumeSummary: body.resumeSummary,
    };
}

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    },
) {
    const { id: resumeProfileId } = await context.params;

    const json = await request.json().catch(() => null);
    const body = parseBody(json);

    if (!body) {
        return Response.json(
            {
                error: "Invalid request body",
            },
            { status: 400 },
        );
    }

    const repository = new InMemoryCoverLetterDraftRepository();

    const draft = await createCoverLetterDraft(repository, {
        resumeProfileId,
        ...body,
    });

    return Response.json(
        {
            ...draft,
            createdAt: draft.createdAt.toISOString(),
        },
        { status: 201 },
    );
}