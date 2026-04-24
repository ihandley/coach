"use client";

import { useEffect, useState } from "react";

type JobListItem = {
    id: string;
    company: string;
    title: string;
    status: string;
    updatedAt: string;
};

export function JobsPageClient() {
    const [jobs, setJobs] = useState<JobListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sourceUrl, setSourceUrl] = useState("");
    const [sourceText, setSourceText] = useState("");

    async function loadJobs() {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        setJobs(data);
    }

    useEffect(() => {
        loadJobs();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceUrl: sourceUrl || undefined,
                    sourceText: sourceText || undefined,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to create job");
            }

            // reset form
            setSourceUrl("");
            setSourceText("");

            // refresh jobs
            await loadJobs();
        } catch (err) {
            setError("Something went wrong while creating the job");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1>Jobs</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        placeholder="Job URL"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        style={{ width: "100%", marginBottom: 8 }}
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Paste job description"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        style={{ width: "100%", height: 120 }}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Add Job"}
                </button>

                {error && <p>{error}</p>}
            </form>

            {jobs.length === 0 ? (
                <p>No jobs yet.</p>
            ) : (
                <ul>
                    {jobs.map((job) => (
                        <li key={job.id}>
                            <div>{job.company}</div>
                            <div>
                                <a href={`/jobs/${job.id}`}>{job.title}</a>
                            </div>
                            <div>{job.status}</div>
                            <div>{job.updatedAt.slice(0, 10)}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
