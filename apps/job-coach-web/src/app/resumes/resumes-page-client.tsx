"use client";

import { useEffect, useState } from "react";

type ResumeProfile = {
    id: string;
    name: string;
};

export function ResumesPageClient() {
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [resumes, setResumes] = useState<ResumeProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function loadResumes() {
        const res = await fetch("/api/resume-profiles");
        const data = await res.json();
        setResumes(data);
    }

    useEffect(() => {
        loadResumes();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/resume-profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    source: {
                        kind: "manual",
                        label: "Pasted Resume",
                    },
                    normalizedResume: {
                        rawText: text,
                    },
                }),
            });

            if (!res.ok) {
                throw new Error("Failed");
            }

            setName("");
            setText("");
            setSuccess("Resume saved");
            await loadResumes();
        } catch {
            setError("Failed to save resume");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Resumes</h1>

            <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
                <div>
                    <input
                        placeholder="Resume name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: "100%", marginBottom: 8 }}
                        required
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Paste resume text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        style={{ width: "100%", height: 160 }}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Resume"}
                </button>

                {error && <p>{error}</p>}
                {success && <p>{success}</p>}
            </form>

            <div>
                <h2>Saved Resumes</h2>

                {resumes.length === 0 && <p>No resumes yet.</p>}

                <ul>
                    {resumes.map((r) => (
                        <li key={r.id}>{r.name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
