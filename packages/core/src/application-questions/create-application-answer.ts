export interface CreateApplicationAnswerInput {
    question: string;
    candidateName: string;
    companyName: string;
    jobTitle: string;
    jobSummary: string;
    resumeSummary: string;
}

export interface ApplicationAnswer {
    answer: string;
}

export async function createApplicationAnswer(
    input: CreateApplicationAnswerInput,
): Promise<ApplicationAnswer> {
    const answer = [
        `I am interested in the ${input.jobTitle} role at ${input.companyName} because ${input.jobSummary}`,
        `My background is a strong fit because ${input.resumeSummary}`,
    ].join(" ");

    return { answer };
}