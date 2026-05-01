"use client";

import { useEffect, useMemo, useState } from "react";

type ResumeProfile = {
  id: string;
  name: string;
  source?: {
    label?: string;
  };
};

type MatchResult = {
  score?: number;
  reasons?: string[];
};

function getResumeLabel(profile: ResumeProfile) {
  return profile.source?.label || profile.name;
}

export function ResumeTailorPanel({ jobId }: { jobId: string }) {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume.id === selectedResumeId),
    [resumes, selectedResumeId],
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadResumes() {
      setLoadingResumes(true);
      setError(null);

      const res = await fetch("/api/resume-profiles");
      const data = await res.json().catch(() => null);

      if (!isCurrent) {
        return;
      }

      if (!res.ok) {
        setError(data?.error ?? "Unable to load resumes.");
        setLoadingResumes(false);
        return;
      }

      const nextResumes = Array.isArray(data) ? data : [];
      setResumes(nextResumes);
      setSelectedResumeId(nextResumes[0]?.id ?? "");
      setLoadingResumes(false);
    }

    loadResumes();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function tailorResume() {
    if (!selectedResumeId) {
      return;
    }

    setTailoring(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          resumeProfileId: selectedResumeId,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Unable to tailor this resume.");
        return;
      }

      setResult(data);
    } catch {
      setError("Unable to tailor this resume.");
    } finally {
      setTailoring(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700" htmlFor="resume-profile">
          Resume
        </label>
        <select
          id="resume-profile"
          value={selectedResumeId}
          onChange={(event) => setSelectedResumeId(event.target.value)}
          disabled={loadingResumes || resumes.length === 0}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
        >
          {loadingResumes ? (
            <option>Loading resumes...</option>
          ) : resumes.length === 0 ? (
            <option>No resumes available</option>
          ) : (
            resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {getResumeLabel(resume)}
              </option>
            ))
          )}
        </select>

        <button
          type="button"
          onClick={tailorResume}
          disabled={tailoring || !selectedResumeId}
          className="btn-primary disabled:opacity-50"
        >
          {tailoring ? "Tailoring..." : "Tailor Resume"}
        </button>

        {selectedResume && result ? (
          <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
            Tailor Resume completed for {getResumeLabel(selectedResume)}
            {typeof result.score === "number" ? ` (${Math.round(result.score)}%)` : ""}.
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
