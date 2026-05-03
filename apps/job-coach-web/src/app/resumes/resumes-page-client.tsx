"use client";

import { useEffect, useState } from "react";
import ImportDropzone from "./import-dropzone";

type Resume = {
  id: string;
  name: string;
  createdAt?: string;
  created_at?: string;
  currentVersionId?: string;
  current_version_id?: string;
  currentVersion?: {
    id?: string;
    kind?: string;
    source?: {
      label?: string;
    };
  } | null;
  isBaseline?: boolean;
  source?: {
    label?: string;
  };
};

type PreviewResume = {
  id: string;
  name: string;
};

type StructuredResume = {
  basics?: {
    fullName?: string;
    name?: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    summary?: string;
  };
  skills?: Array<string | { category?: string; items?: string[] }>;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    field?: string;
    startYear?: string;
    endYear?: string;
    details?: string[];
  }>;
};

function getSkillGroups(skills?: StructuredResume["skills"]) {
  if (!skills?.length) {
    return [];
  }

  if (skills.every((skill) => typeof skill === "string")) {
    return [
      {
        category: "Skills",
        items: skills.filter((skill): skill is string => typeof skill === "string"),
      },
    ];
  }

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return { category: "Skills", items: [skill] };
      }

      return {
        category: skill.category || "Skills",
        items: skill.items?.filter(Boolean) ?? [],
      };
    })
    .filter((group) => group.items.length > 0);
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6 18 20H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export default function FilesPageClient() {
  const [files, setFiles] = useState<Resume[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewResume, setPreviewResume] = useState<PreviewResume | null>(null);
  const [previewData, setPreviewData] = useState<StructuredResume | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFiles() {
    const res = await fetch("/api/resume-profiles");
    const data = await res.json();
    setFiles(data || []);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/resume-profiles/import", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Import failed");
      setLoading(false);
      return;
    }

    setFile(null);
    setLoading(false);
    loadFiles();
  }

  async function handleDelete(id: string) {
    const previousFiles = files;

    setDeletingId(id);
    setError(null);
    setFiles((currentFiles) => currentFiles.filter((resume) => resume.id !== id));

    const res = await fetch(`/api/resume-profiles/${id}/delete`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setFiles(previousFiles);
      setError(data?.error ?? "Delete failed");
    } else {
      await loadFiles();
    }

    setDeletingId(null);
  }

  function handlePreview(resume: Resume) {
    setError(null);
    setPreviewResume({ id: resume.id, name: getResumeDisplayName(resume) });
  }

  useEffect(() => {
    if (!previewResume) {
      setPreviewData(null);
      return;
    }

    let isCurrent = true;

    async function loadPreview() {
      setPreviewLoading(true);

      const res = await fetch(`/api/resume-profiles/${previewResume?.id}`);
      const data = await res.json().catch(() => null);

      if (!isCurrent) {
        return;
      }

      if (!res.ok) {
        setError(data?.error ?? "Preview failed");
        setPreviewLoading(false);
        return;
      }

      setPreviewData(data?.version?.normalized_resume ?? null);
      setPreviewLoading(false);
    }

    loadPreview();

    return () => {
      isCurrent = false;
    };
  }, [previewResume]);

  function getExportFilename(response: Response, fallbackName: string) {
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);

    return match?.[1] ?? `${fallbackName}.pdf`;
  }

  async function handleDownload(resume: Resume) {
    const resumeVersionId =
      resume.currentVersion?.id || resume.currentVersionId || resume.current_version_id;

    if (!resumeVersionId) {
      setError("No resume version available to export.");
      return;
    }

    const displayName = getResumeDisplayName(resume);

    setDownloadingId(resume.id);
    setError(null);

    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "resume",
          format: "pdf",
          resumeProfileId: resume.id,
          resumeVersionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Export failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getExportFilename(res, displayName);
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    } finally {
      setDownloadingId(null);
    }
  }

  function getResumeDisplayName(resume: Resume) {
    if (resume.currentVersion?.kind === "tailored" && resume.currentVersion.source?.label) {
      return resume.currentVersion.source.label;
    }

    return resume.name || resume.source?.label || "Untitled Resume";
  }

  const previewSkillGroups = getSkillGroups(previewData?.skills);

  return (
    <div className="space-y-8">
      {/* Import */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Import Files</h2>
        <ImportDropzone file={file} setFile={setFile} onImport={handleImport} loading={loading} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* List */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Files</h2>

        {files.length === 0 && <p className="text-gray-500">No files yet.</p>}

        <div className="space-y-3">
          {files.map((r) => {
            const displayName = getResumeDisplayName(r);

            return (
              <div key={r.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>{displayName}</span>
                    <button
                      type="button"
                      onClick={() => handlePreview(r)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      aria-label={`Preview ${displayName}`}
                      title="Preview"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </button>
                    {r.isBaseline && <span className="ml-2 text-xs text-blue-600">BASELINE</span>}
                    {r.currentVersion?.kind === "tailored" && (
                      <span className="ml-2 text-xs text-green-700">TAILORED</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(r.createdAt ?? r.created_at ?? "").toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(r)}
                    disabled={downloadingId === r.id}
                    aria-label={`Download ${displayName}`}
                    className="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <DownloadIcon />
                    {downloadingId === r.id ? "Exporting..." : "Download"}
                  </button>

                  {!r.isBaseline && (
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      aria-label={`Delete ${displayName}`}
                      className="inline-flex items-center gap-1.5 rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <TrashIcon />
                      {deletingId === r.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {previewResume && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-preview-title"
        >
          <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 id="resume-preview-title" className="text-lg font-semibold">
                {previewResume.name}
              </h2>
              <button
                onClick={() => {
                  setPreviewResume(null);
                  setPreviewData(null);
                }}
                className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {previewLoading && <p className="text-sm text-gray-500">Loading preview...</p>}

              {!previewLoading && previewData && (
                <div className="space-y-6">
                  <header className="border-b pb-4">
                    <h3 className="text-2xl font-semibold text-gray-950">
                      {previewData.basics?.fullName ||
                        previewData.basics?.name ||
                        previewResume.name}
                    </h3>
                    {previewData.basics?.headline && (
                      <p className="mt-1 text-base text-gray-700">{previewData.basics.headline}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {previewData.basics?.location && <span>{previewData.basics.location}</span>}
                      {previewData.basics?.email && <span>{previewData.basics.email}</span>}
                      {previewData.basics?.phone && <span>{previewData.basics.phone}</span>}
                      {previewData.basics?.linkedin && <span>{previewData.basics.linkedin}</span>}
                    </div>
                  </header>

                  {previewData.basics?.summary && (
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Summary
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-gray-700">
                        {previewData.basics.summary}
                      </p>
                    </section>
                  )}

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Skills
                    </h4>
                    {previewSkillGroups.length ? (
                      <div className="mt-3 space-y-3">
                        {previewSkillGroups.map((group) => (
                          <div key={group.category}>
                            <h5 className="text-sm font-medium text-gray-800">{group.category}</h5>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.items.map((skill) => (
                                <span
                                  key={`${group.category}-${skill}`}
                                  className="rounded border border-gray-200 bg-gray-50 px-2.5 py-1 text-sm text-gray-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">No skills found.</p>
                    )}
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Experience
                    </h4>
                    <div className="mt-3 space-y-4">
                      {previewData.experience?.length ? (
                        previewData.experience.map((item, index) => (
                          <article key={`${item.title}-${item.company}-${index}`}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h5 className="font-medium text-gray-950">
                                {[item.title, item.company].filter(Boolean).join(" at ") ||
                                  "Experience"}
                              </h5>
                              {[item.startDate, item.endDate].filter(Boolean).length > 0 && (
                                <span className="text-sm text-gray-500">
                                  {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                                </span>
                              )}
                            </div>
                            {item.location && (
                              <p className="text-sm text-gray-500">{item.location}</p>
                            )}
                            {item.bullets?.length ? (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                {item.bullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            ) : null}
                          </article>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No experience found.</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Education
                    </h4>
                    <div className="mt-3 space-y-3">
                      {previewData.education?.length ? (
                        previewData.education.map((item, index) => (
                          <article key={`${item.school}-${index}`}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h5 className="font-medium text-gray-950">
                                {item.school || "Education"}
                              </h5>
                              {[item.startYear, item.endYear].filter(Boolean).length > 0 && (
                                <span className="text-sm text-gray-500">
                                  {[item.startYear, item.endYear].filter(Boolean).join(" - ")}
                                </span>
                              )}
                            </div>
                            {[item.degree, item.field].filter(Boolean).length > 0 && (
                              <p className="text-sm text-gray-700">
                                {[item.degree, item.field].filter(Boolean).join(", ")}
                              </p>
                            )}
                            {item.details?.length ? (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                {item.details.map((detail) => (
                                  <li key={detail}>{detail}</li>
                                ))}
                              </ul>
                            ) : null}
                          </article>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No education found.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
