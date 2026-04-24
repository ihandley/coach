"use client";

import { useState } from "react";

export function JobMatchButton({
    jobId,
    resumeProfileId,
}: {
    jobId: string;
    resumeProfileId: string;
}) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    async function runMatch() {
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    resumeProfileId,
                }),
            });

            const data = await res.json();
            setResult(data);

            // persist result
            await fetch("/api/match/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    resumeProfileId,
                    result: data,
                }),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <button onClick={runMatch} disabled={loading || !resumeProfileId}>
                {loading ? "Scoring..." : "Match"}
            </button>

            {result && (
                <div style={{ marginTop: 8 }}>
                    <div>Score: {result.score}</div>
                    <ul>
                        {result.reasons?.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
