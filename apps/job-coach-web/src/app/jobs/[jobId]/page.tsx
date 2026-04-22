import { EvaluationPanel } from "./evaluation-panel";
import { getLatestEvaluation, scoreJobFit } from "./evaluation-client";

export default function JobPage({
    params,
}: {
    params: { jobId: string };
}) {
    const jobId = params.jobId;

    return (
        <div>
            <h1>Job {jobId}</h1>

            <EvaluationPanel
                jobId={jobId}
                resumeProfileId="resume-123"
                getLatestEvaluation={getLatestEvaluation}
                scoreJobFit={scoreJobFit}
            />
        </div>
    );
}