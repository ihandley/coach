"use client";

import { useEffect, useMemo, useState } from "react";

type ResumeProfile = {
  id: string;
  name: string;
  currentVersionId?: string | null;
  source?: {
    label?: string;
  };
};

function getResumeLabel(profile: ResumeProfile) {
  return profile.source?.label || profile.name;
}

export function ResumeTailorPanel({ jobId }: { jobId: string }) {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResumeCreated, setTailoredResumeCreated] = useState(false);
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

      try {
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

        const nextResumes = Array.isArray(data)
          ? data.map((profile) => ({
              id: profile.id,
              name: profile.name || "Untitled Resume",
              currentVersionId: profile.currentVersionId || profile.current_version_id || "",
              source: profile.source,
            }))
          : [];

        setResumes(nextResumes);
        setSelectedResumeId("");
        setLoadingResumes(false);
      } catch {
        if (!isCurrent) {
          return;
        }

        setError("Unable to load resumes.");
        setResumes([]);
        setLoadingResumes(false);
      }
    }

    loadResumes();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function tailorResume() {
    if (!selectedResume?.currentVersionId) {
      return;
    }

    setTailoring(true);
    setTailoredResumeCreated(false);
    setError(null);

    try {
      const res = await fetch(`/api/resume-profiles/${selectedResume.id}/tailored-resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          sourceResumeVersionId: selectedResume.currentVersionId,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Unable to tailor this resume.");
        return;
      }

      setTailoredResumeCreated(true);
    } catch {
      setError("Unable to tailor this resume.");
    } finally {
      setTailoring(false);
    }
  }

  const canTailor = Boolean(selectedResume?.currentVersionId);

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
            <>
              <option value="">Select resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {getResumeLabel(resume)}
                </option>
              ))}
            </>
          )}
        </select>

        <button
          type="button"
          onClick={tailorResume}
          disabled={tailoring || !canTailor}
          className="btn-primary disabled:opacity-50"
        >
          {tailoring ? "Tailoring..." : "Tailor Resume"}
        </button>

        {selectedResume && !selectedResume.currentVersionId ? (
          <p className="text-sm text-gray-600">
            Selected resume has no current version. Import a resume version before tailoring.
          </p>
        ) : null}

        {tailoredResumeCreated ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Tailored resume created.{" "}
            <a href="/resumes" className="font-medium underline">
              View resumes
            </a>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
