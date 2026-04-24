import { AppShell } from "../../app-shell";

async function getJob(jobId: string) {
    const res = await fetch(`http://localhost:3000/api/jobs/${jobId}`, {
        cache: "no-store",
    });
    return res.json();
}

async function getMatches(jobId: string) {
    const res = await fetch(
        `http://localhost:3000/api/jobs/${jobId}/matches`,
        { cache: "no-store" }
    );
    return res.json();
}

export default async function JobDetailPage({
    params,
}: {
    params: Promise<{ jobId: string }>;
}) {
    const { jobId } = await params;

    const job = await getJob(jobId);
    const matches = await getMatches(jobId);

    return (
        <AppShell>
            <div>
                <h1>{job?.title ?? "Job"}</h1>
                <p>{job?.company}</p>

                <h2>Match History</h2>

                {matches?.length ? (
                    <ul>
                        {matches.map((m: any, i: number) => (
                            <li key={i}>
                                <div>Score: {m.result?.score}</div>
                                <ul>
                                    {m.result?.reasons?.map((r: string, j: number) => (
                                        <li key={j}>{r}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No matches yet</p>
                )}
            </div>
        </AppShell>
    );
}
