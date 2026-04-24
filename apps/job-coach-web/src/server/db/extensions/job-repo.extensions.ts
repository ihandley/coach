export function extendJobRepo(repo: any) {
    return {
        ...repo,

        getJob(jobId: string) {
            return {
                id: jobId,
                title: "Unknown",
                company: "Unknown",
                sourceText: "",
            };
        },

        saveMatchResult(_: {
            jobId: string;
            resumeProfileId: string;
            result: any;
        }) {
            return { ok: true };
        },
    };
}
