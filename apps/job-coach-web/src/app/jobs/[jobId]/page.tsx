import { JobStatusSelect } from "./job-status-select";
import { ResumeTailorPanel } from "./resume-tailor-panel";
import { notFound } from "next/navigation";

type Job = {
  id: string;
  title: string;
  company: string;
  status: string;
  sourceUrl?: string;
  sourceText?: string;
};

async function getJob(jobId: string): Promise<Job | null> {
  const res = await fetch(`http://localhost:3000/api/jobs/${jobId}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) return notFound();

  return (
    <div className="space-y-6">
      <a href="/jobs" className="text-sm text-blue-600 underline">
        ← Back to jobs
      </a>

      <div>
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <div className="text-gray-600">{job.company}</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <JobStatusSelect jobId={job.id} initialStatus={job.status} />
      </div>

      <ResumeTailorPanel jobId={job.id} />

      {job.sourceUrl ? (
        <a href={job.sourceUrl} target="_blank" className="text-blue-600 underline">
          View Original Posting
        </a>
      ) : null}

      {job.sourceText ? (
        <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm">
          {job.sourceText}
        </pre>
      ) : null}
    </div>
  );
}
