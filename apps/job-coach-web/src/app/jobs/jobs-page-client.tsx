"use client";

import { useEffect, useState } from "react";

type Job = {
    id: string;
    company: string;
    title: string;
    status: string;
};

export default function JobsPageClient() {
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        fetch("/api/jobs")
            .then((res) => res.json())
            .then(setJobs);
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h1>Jobs</h1>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                        <th style={{ padding: 8 }}>Company</th>
                        <th style={{ padding: 8 }}>Title</th>
                        <th style={{ padding: 8 }}>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {jobs.map((job) => (
                        <tr key={job.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: 8 }}>{job.company}</td>
                            <td style={{ padding: 8 }}>{job.title}</td>
                            <td style={{ padding: 8 }}>
                                <StatusBadge status={job.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const color =
        status === "applied"
            ? "green"
            : status === "rejected"
                ? "red"
                : "#666";

    return (
        <span style={{ color, fontWeight: 600 }}>
            {status}
        </span>
    );
}