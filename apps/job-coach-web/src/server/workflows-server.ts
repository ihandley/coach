import { createServerClient } from "@coach/db";
import { createDbWorkflowRunRepository } from "@coach/db";
import { importJobFromUrl } from "./jobs";
import { evaluationsServer } from "./evaluations/server";
import { createWorkflowsServer } from "./workflows";

const db = createServerClient();
const workflowRunRepository = createDbWorkflowRunRepository({ db });

export const workflowsServer = createWorkflowsServer({
    workflowRunRepository,
    importJobFromUrl: async ({ sourceUrl }) => importJobFromUrl(sourceUrl),
    scoreJobFit: async ({ jobId, resumeProfileId }) =>
        evaluationsServer.scoreJobFit({
            jobId,
            resumeProfileId,
        }),
});