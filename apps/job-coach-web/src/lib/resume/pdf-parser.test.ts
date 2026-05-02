import { describe, expect, it } from "vitest";

import { renderSimplePdf } from "@/server/simple-pdf";
import { extractPdfText, normalizeExtractedPdfText } from "./pdf-parser";

describe("extractPdfText", () => {
  it("extracts readable text from a real PDF buffer", async () => {
    const pdf = await renderSimplePdf({
      title: "Resume",
      fileName: "resume.pdf",
      lines: ["Ian Handley", "ian@example.com", "TypeScript React"],
    });

    const text = await extractPdfText(Buffer.from(pdf.buffer));

    expect(text).toContain("Ian Handley");
    expect(text).toContain("ian@example.com");
    expect(text).toContain("Ian Handley\nian@example.com");
    expect(text).not.toContain("%PDF");
  });

  it("normalizes whitespace and common PDF artifacts", () => {
    expect(normalizeExtractedPdfText("Ian\u00ad  Handley\n\n\n(cid:12) Engineer")).toBe(
      "Ian Handley\n\nEngineer",
    );
  });
});
