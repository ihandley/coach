export type FitResult = {
    score: number;
    reasons: string[];
};

type Job = {
    title?: string;
    company?: string;
    sourceText?: string;
};

type Resume = {
    rawText?: string;
};

function tokenize(text: string): string[] {
    return (text ?? "")
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter(Boolean);
}

function overlap(a: string[], b: string[]): number {
    const setB = new Set(b);
    let hits = 0;

    for (const t of a) {
        if (setB.has(t)) hits++;
    }

    return a.length ? hits / a.length : 0;
}

export function calculateFit(job: Job, resume: Resume): FitResult {
    const jobText = [job.title, job.company, job.sourceText]
        .filter(Boolean)
        .join(" ");

    const resumeText = resume.rawText ?? "";

    const jobTokens = tokenize(jobText);
    const resumeTokens = tokenize(resumeText);

    const score = Math.round(overlap(jobTokens, resumeTokens) * 100);

    return {
        score,
        reasons: score > 30 ? ["Good keyword overlap"] : ["Low keyword overlap"],
    };
}
