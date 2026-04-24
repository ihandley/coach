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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Resumes</h1>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Resume</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Resume Name
                        </label>
                        <input
                            id="name"
                            placeholder="e.g., Software Engineer Resume"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
                            Resume Text
                        </label>
                        <textarea
                            id="text"
                            placeholder="Paste your resume text here"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full h-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? "Saving..." : "Save Resume"}
                    </button>

                    {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                    {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}
                </form>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Saved Resumes</h2>
                {resumes.length === 0 ? (
                    <p className="text-gray-500">No resumes saved yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {resumes.map((resume) => (
                            <li
                                key={resume.id}
                                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                            >
                                <span className="font-medium text-gray-900">{resume.name}</span>
                                <span className="text-xs text-gray-500">{resume.id}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
