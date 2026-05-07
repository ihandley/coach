"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type JobReimportPanelProps = {
  jobId: string;
  sourceUrl?: string;
  variant?: "card" | "inline" | "menu-item";
};

type PreviewResponse = {
  sourceUrl: string;
  current: {
    company: string;
    title: string;
    sourceText: string;
    structuredSummary: unknown;
  };
  preview: {
    company: string;
    title: string;
    sourceText: string;
    structuredSummary: unknown;
  };
};

const noRealSourceUrlMessage =
  "This job cannot be re-imported because it does not have a real source URL.";

function hasRealSourceUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatError(error: string | undefined) {
  if (error === "INVALID_SOURCE_URL") {
    return noRealSourceUrlMessage;
  }

  if (error === "FAILED_TO_FETCH_JOB_PAGE") {
    return "Unable to fetch the latest posting from this URL.";
  }

  if (error === "INVALID_EXTRACTED_JOB_DATA") {
    return "Unable to extract complete job data from this posting.";
  }

  return "Unable to re-import this job right now.";
}

export function ReimportJobPanel({ jobId, sourceUrl, variant = "card" }: JobReimportPanelProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [structuredSummary, setStructuredSummary] = useState("");
  const [previewSourceText, setPreviewSourceText] = useState("");
  const [structuredSummaryEdited, setStructuredSummaryEdited] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReimport = hasRealSourceUrl(sourceUrl);

  async function loadPreview() {
    if (!canReimport) {
      setError(noRealSourceUrlMessage);
      return;
    }

    setPreview(null);
    setLoadingPreview(true);
    setError(null);
    setMessage(null);
    setAdvancedOpen(false);

    try {
      const res = await fetch(`/api/jobs/${jobId}/reimport/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(formatError(data?.error));
        return;
      }

      setPreview(data);
      setCompany(data.preview.company);
      setTitle(data.preview.title);
      setSourceText(data.preview.sourceText);
      setPreviewSourceText(data.preview.sourceText);
      setStructuredSummary(JSON.stringify(data.preview.structuredSummary ?? null, null, 2));
      setStructuredSummaryEdited(false);
      setModalOpen(true);
    } catch {
      setError("Unable to re-import this job right now.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setError(null);
    setMessage(null);

    let parsedStructuredSummary: unknown = null;
    const shouldRegenerateStructuredSummary =
      sourceText !== previewSourceText && !structuredSummaryEdited;

    if (!shouldRegenerateStructuredSummary) {
      try {
        parsedStructuredSummary = JSON.parse(structuredSummary);
      } catch {
        setSaving(false);
        setError("Structured summary must be valid JSON.");
        return;
      }
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/reimport`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          title,
          sourceText,
          structuredSummary: parsedStructuredSummary,
          sourceUrl: preview?.sourceUrl ?? sourceUrl,
          resumeProfileId: "default",
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(formatError(data?.error));
        return;
      }

      setMessage("Job re-import saved.");
      setPreview(null);
      router.refresh();
    } catch {
      setError("Unable to save re-imported job data.");
    } finally {
      setSaving(false);
    }
  }

  function keepCurrentValues() {
    if (!preview) return;

    setCompany(preview.current.company);
    setTitle(preview.current.title);
  }

  function cancelPreview() {
    setPreview(null);
    setPreviewSourceText("");
    setStructuredSummaryEdited(false);
    setAdvancedOpen(false);
    setModalOpen(false);
    setError(null);
    setMessage(null);
  }

  function closeModal() {
    setModalOpen(false);
  }

  const trigger = (
    <button
      type="button"
      role={variant === "menu-item" ? "menuitem" : undefined}
      onClick={loadPreview}
      disabled={loadingPreview || !canReimport}
      className={
        variant === "menu-item"
          ? "w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-white"
          : "btn-primary text-sm disabled:opacity-50"
      }
    >
      {loadingPreview ? "Re-importing..." : "Re-import from URL"}
    </button>
  );

  const modal = modalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close re-import modal"
        onClick={closeModal}
        className="absolute inset-0 cursor-default bg-black/30"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`reimport-title-${jobId}`}
        className="relative flex max-h-[90vh] w-full max-w-[720px] flex-col rounded-lg bg-white shadow-2xl"
      >
        <header className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={`reimport-title-${jobId}`} className="text-lg font-semibold text-gray-900">
                Review imported job data
              </h2>
              {sourceUrl ? (
                <p className="mt-1 break-all text-sm text-gray-500">{sourceUrl}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-700">{message}</p> : null}

            {preview ? (
              <>
                <div className="overflow-hidden rounded-md border border-gray-200">
                  <div className="grid grid-cols-3 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <div className="px-3 py-2">Field</div>
                    <div className="px-3 py-2">Current</div>
                    <div className="px-3 py-2">Imported</div>
                  </div>
                  <div className="grid grid-cols-3 border-t border-gray-200 text-sm">
                    <div className="px-3 py-2 font-medium text-gray-700">Company</div>
                    <div className="px-3 py-2 text-gray-700">{preview.current.company}</div>
                    <div className="px-3 py-2 text-gray-900">{preview.preview.company}</div>
                  </div>
                  <div className="grid grid-cols-3 border-t border-gray-200 text-sm">
                    <div className="px-3 py-2 font-medium text-gray-700">Title</div>
                    <div className="px-3 py-2 text-gray-700">{preview.current.title}</div>
                    <div className="px-3 py-2 text-gray-900">{preview.preview.title}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">Final values</h3>
                    <button
                      type="button"
                      onClick={keepCurrentValues}
                      className="text-sm font-medium text-blue-600 underline"
                    >
                      Keep current values
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Final company
                      <input
                        value={company}
                        onChange={(event) => setCompany(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>

                    <label className="block text-sm font-medium text-gray-700">
                      Final title
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200">
                  <button
                    type="button"
                    aria-expanded={advancedOpen}
                    onClick={() => setAdvancedOpen((value) => !value)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700"
                  >
                    <span>Advanced import details</span>
                    <span aria-hidden="true">{advancedOpen ? "-" : "+"}</span>
                  </button>

                  {advancedOpen ? (
                    <div className="space-y-4 border-t border-gray-200 px-3 pb-3 pt-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Raw posting text
                        <textarea
                          value={sourceText}
                          onChange={(event) => setSourceText(event.target.value)}
                          rows={8}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
                        />
                      </label>

                      <label className="block text-sm font-medium text-gray-700">
                        Structured summary JSON
                        <textarea
                          value={structuredSummary}
                          onChange={(event) => {
                            setStructuredSummary(event.target.value);
                            setStructuredSummaryEdited(true);
                          }}
                          rows={8}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={cancelPreview}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving || !preview}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </footer>
      </section>
    </div>
  ) : null;

  if (variant === "inline" || variant === "menu-item") {
    return (
      <>
        {trigger}
        {modal}
      </>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Source import</h2>
            {sourceUrl ? <p className="break-all text-sm text-gray-600">{sourceUrl}</p> : null}
          </div>
          {trigger}
        </div>

        {!canReimport ? <p className="text-sm text-gray-600">{noRealSourceUrlMessage}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {modal}
      </div>
    </section>
  );
}
