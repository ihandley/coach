"use client";

import { useEffect, useState } from "react";

export function JobMatchView({ jobId }: { jobId: string }) {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId,
                resumeProfileId: "default",
            }),
        })
            .then((r) => r.json())
            .then((data) => setMatches([data]))
            .finally(() => setLoading(false));
    }, [jobId]);

    if (loading) {
        return <div className="text-sm text-gray-500">Loading match details...</div>;
    }

    return (
        <div className="space-y-2 rounded-md border border-gray-100 bg-gray-50 p-3">
            <h4 className="text-sm font-semibold text-gray-900">Match Details</h4>
            {matches.length === 0 ? (
                <p className="text-xs text-gray-500">No match data available.</p>
            ) : (
                matches.map((m, i) => (
                    <div key={i} className="space-y-1">
                        <div className="text-xs text-gray-700">
                            <span className="font-medium">Score:</span> {Math.round(m.score * 100)}%
                        </div>
                        {m.reasons && m.reasons.length > 0 && (
                            <ul className="space-y-1">
                                {m.reasons.map((r: string, j: number) => (
                                    <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>{r}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
