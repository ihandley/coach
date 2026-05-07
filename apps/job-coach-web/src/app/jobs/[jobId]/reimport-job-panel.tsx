"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type JobReimportPanelProps = {
  jobId: string;
  sourceUrl?: string;
  variant?: "card" | "inline";
};

type PreviewResponse = {
  sourceUrl: string;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [structuredDataOpen, setStructuredDataOpen] = useState(false);
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

    setDrawerOpen(true);
    setPreview(null);
    setLoadingPreview(true);
    setError(null);
    setMessage(null);
    setStructuredDataOpen(false);

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

  function cancelPreview() {
    setPreview(null);
    setPreviewSourceText("");
    setStructuredSummaryEdited(false);
    setStructuredDataOpen(false);
    setDrawerOpen(false);
    setError(null);
    setMessage(null);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  const trigger = (
    <button
      type="button"
      onClick={loadPreview}
      disabled={loadingPreview || !canReimport}
      className="btn-primary text-sm disabled:opacity-50"
    >
      {loadingPreview ? "Re-importing..." : "Re-import from URL"}
    </button>
  );

  const drawer = drawerOpen ? (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close re-import drawer"
        onClick={closeDrawer}
        className="absolute inset-0 cursor-default bg-black/20"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`reimport-title-${jobId}`}
        className="absolute inset-y-0 right-0 flex w-full max-w-[700px] flex-col bg-white shadow-2xl sm:w-[45vw]"
      >
        <header className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={`reimport-title-${jobId}`} className="text-lg font-semibold text-gray-900">
                Re-import from URL
              </h2>
              {sourceUrl ? (
                <p className="mt-1 break-all text-sm text-gray-600">{sourceUrl}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {loadingPreview ? <p className="text-sm text-gray-600">Loading preview...</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-700">{message}</p> : null}

            {preview ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Company
                    <input
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  <label className="block text-sm font-medium text-gray-700">
                    Title
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-gray-700">
                  Raw View
                  <textarea
                    value={sourceText}
                    onChange={(event) => setSourceText(event.target.value)}
                    rows={16}
                    className="mt-1 min-h-[360px] w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
                  />
                </label>

                <div className="rounded-md border border-gray-200">
                  <button
                    type="button"
                    aria-expanded={structuredDataOpen}
                    onClick={() => setStructuredDataOpen((value) => !value)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700"
                  >
                    <span>Advanced Structured Data</span>
                    <span aria-hidden="true">{structuredDataOpen ? "-" : "+"}</span>
                  </button>

                  {structuredDataOpen ? (
                    <label className="block border-t border-gray-200 px-3 pb-3 pt-2 text-sm font-medium text-gray-700">
                      Structured View
                      <textarea
                        value={structuredSummary}
                        onChange={(event) => {
                          setStructuredSummary(event.target.value);
                          setStructuredSummaryEdited(true);
                        }}
                        rows={10}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
                      />
                    </label>
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

  if (variant === "inline") {
    return (
      <>
        {trigger}
        {drawer}
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
        {drawer}
      </div>
    </section>
  );
}
