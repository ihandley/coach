export function cleanJobText(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/\r/g, "")
    .replace(/Sign in[\s\S]*?Cookie Policy\./gi, "")
    .replace(/Report this job/gi, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
