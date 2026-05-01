"use client";

import { useRef } from "react";

export default function ImportDropzone({
  file,
  setFile,
  onImport,
  loading,
}: any) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      {!file ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center hover:bg-gray-50"
        >
          <p className="text-sm text-gray-600">
            Drag & drop your resume or cover letter (PDF)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            or click to upload
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            📄 {file.name}
          </div>

          <div className="space-x-2">
            <button
              onClick={() => setFile(null)}
              className="text-sm text-gray-500"
            >
              Remove
            </button>

            <button
              onClick={onImport}
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}
