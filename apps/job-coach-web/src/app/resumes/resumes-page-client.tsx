"use client";

import { useEffect, useState } from "react";

type ResumeProfile = {
    id: string;
    name: string;
};

export function ResumesPageClient() {
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [resumes, setResumes] = useState<ResumeProfile[]>([]);
    const [loading, setLoading] = useState(false);

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

        await fetch("/api/resume-profiles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                source: {
                    kind: "manual",
                    label: "Pasted Resume",
                },
                normalizedResume: {
                    rawText: content,
                },
            }),
        });

        setName("");
        setContent("");
        await loadResumes();
        setLoading(false);
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
                        required
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Paste resume here"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={10}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Resume"}
                </button>
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
