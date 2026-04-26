export function cleanJobText(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/\s+/g, " ")
    .replace(/Sign in.*?Cookie Policy\./gi, "")
    .replace(/Report this job/gi, "")
    .trim();
}
