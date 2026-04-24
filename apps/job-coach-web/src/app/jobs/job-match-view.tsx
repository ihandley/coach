"use client";

import { useEffect, useState } from "react";

export function JobMatchView({ jobId }: { jobId: string }) {
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId,
                resumeProfileId: "default",
            }),
        })
            .then((r) => r.json())
            .then((data) => setMatches([data]));
    }, [jobId]);

    return (
        <div>
            <h4>Match</h4>
            {matches.map((m, i) => (
                <div key={i}>
                    <div>Score: {m.score}</div>
                    <ul>
                        {m.reasons?.map((r: string, j: number) => (
                            <li key={j}>{r}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
