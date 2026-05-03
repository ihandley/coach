import * as fs from "node:fs";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { createImportResumeFromText } from "./import-resume-from-text";

type PdfjsWorkerGlobal = typeof globalThis & {
  pdfjsWorker?: unknown;
};

type TextContentItem = {
  str?: string;
  transform?: number[];
};

async function ensurePdfWorker() {
  const workerGlobal = globalThis as PdfjsWorkerGlobal;

  if (!workerGlobal.pdfjsWorker) {
    workerGlobal.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  }
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\u00ad/g, "")
    .replace(/\(cid:\d+\)/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(buffer: Buffer) {
  await ensurePdfWorker();

  const loadingTask = getDocument({
    data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    disableFontFace: true,
    useWorkerFetch: false,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageLines: string[] = [];
      let currentY: number | null = null;

      for (const item of content.items as TextContentItem[]) {
        const text = item.str ?? "";
        const y = item.transform?.[5];

        if (!text) {
          continue;
        }

        if (typeof y === "number" && currentY !== null && Math.abs(y - currentY) > 2) {
          pageLines.push("\n");
        } else if (pageLines.length > 0) {
          pageLines.push(" ");
        }

        pageLines.push(text);
        currentY = typeof y === "number" ? y : currentY;
      }

      pages.push(pageLines.join(""));
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return normalizeExtractedText(pages.join("\n\n"));
}

export function createImportResumeFromPdf(deps: {
  importResumeFromText: ReturnType<typeof createImportResumeFromText>;
}) {
  const { importResumeFromText } = deps;

  return async function importResumeFromPdf(input: { name: string; filePath: string }) {
    const buffer = fs.readFileSync(input.filePath);
    const text = await extractPdfText(buffer);

    return importResumeFromText({
      name: input.name,
      text,
    });
  };
}
