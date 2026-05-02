import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

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
    workerGlobal.pdfjsWorker = await import(
      "pdfjs-dist/legacy/build/pdf.worker.mjs"
    );
  }
}

function toPdfData(input: ArrayBuffer | Uint8Array | Buffer) {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}

export function normalizeExtractedPdfText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\u00ad/g, "")
    .replace(/\(cid:\d+\)/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(input: ArrayBuffer | Uint8Array | Buffer) {
  await ensurePdfWorker();

  const loadingTask = getDocument({
    data: toPdfData(input),
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

        if (
          typeof y === "number" &&
          currentY !== null &&
          Math.abs(y - currentY) > 2
        ) {
          pageLines.push("\n");
        } else if (pageLines.length > 0) {
          pageLines.push(" ");
        }

        pageLines.push(text);
        currentY = typeof y === "number" ? y : currentY;
      }
      const pageText = pageLines.join("");

      pages.push(pageText);
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return normalizeExtractedPdfText(pages.join("\n\n"));
}
