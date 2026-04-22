import type { ExtractJob, FetchedJobPage } from "@coach/core";

export const extractJobStub: ExtractJob = async (
    input: FetchedJobPage,
) => {
    return {
        company: "Unknown",
        title: "Unknown",
        rawDescription: input.html,
    };
};