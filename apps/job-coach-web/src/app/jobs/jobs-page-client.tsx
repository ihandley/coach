"use client";

import { useEffect, useState } from "react";
import { JobMatchButton } from "./job-match-button";
import { JobMatchView } from "./job-match-view";

type RankedJob = {
    id: string;
    title: string;
    company: string;
    score: number;
};

export function JobsPageClient() {
    const [jobs, setJobs] = useState<RankedJob[]>([]);
    const [url, setUrl] = useState("");

    async function load() {
        const res = await fetch("/api/jobs/ranked");
        setJobs(await res.json());
    }

    async function handleImport() {
        if (!url) return;

        await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceUrl: url }),
        });

        await load();
        setUrl("");
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Ranked Jobs</h1>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex gap-2">
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste job URL"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleImport}
                        disabled={!url}
                        className="btn-primary disabled:opacity-50"
                    >
                        Import
                    </button>
                </div>
            </div>

            {jobs.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <p className="text-gray-500">No jobs yet. Import one to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map((job) => (
                        <div key={job.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="mb-2 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                    <p className="text-sm text-gray-600">{job.company}</p>
                                </div>
                                <div className="flex items-center rounded-full bg-blue-100 px-3 py-1">
                                    <span className="text-sm font-medium text-blue-900">
                                        {Math.round(job.score * 100)}%
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-gray-100 pt-3 mt-3">
                                <JobMatchButton jobId={job.id} resumeProfileId="default" />
                                <JobMatchView jobId={job.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
