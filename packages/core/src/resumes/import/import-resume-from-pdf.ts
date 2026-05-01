import fs from "fs";
import pdf from "pdf-parse";

import { createImportResumeFromText } from "./import-resume-from-text";

export function createImportResumeFromPdf(deps: {
  importResumeFromText: ReturnType<typeof createImportResumeFromText>;
}) {
  const { importResumeFromText } = deps;

  return async function importResumeFromPdf(input: {
    name: string;
    filePath: string;
  }) {
    const buffer = fs.readFileSync(input.filePath);
    const data = await pdf(buffer);

    return importResumeFromText({
      name: input.name,
      text: data.text,
    });
  };
}
