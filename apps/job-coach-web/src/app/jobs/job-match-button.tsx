"use client";

import { useState } from "react";

type MatchResult = {
    score: number;
    reasons: string[];
};

export function JobMatchButton({
    jobId,
    resumeProfileId,
}: {
    jobId: string;
    resumeProfileId: string;
}) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MatchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function runMatch() {
        setLoading(true);
        setResult(null);
        setError(null);

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

            if (!res.ok) {
                setError(
                    typeof data?.error === "string"
                        ? data.error
                        : "Unable to score this job.",
                );
                return;
            }

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
        } catch {
            setError("Unable to score this job.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <button
                onClick={runMatch}
                disabled={loading || !resumeProfileId}
                className="btn-primary w-full disabled:opacity-50"
            >
                {loading ? "Scoring..." : "Match"}
            </button>

            {error ? (
                <p className="text-xs text-red-600">{error}</p>
            ) : null}

            {result ? (
                <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                    <div className="text-sm font-semibold text-blue-950">
                        Match score: {Math.round(result.score)}%
                    </div>
                    <ul className="mt-2 space-y-1">
                        {result.reasons.map((reason) => (
                            <li key={reason} className="text-xs text-blue-900">
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
