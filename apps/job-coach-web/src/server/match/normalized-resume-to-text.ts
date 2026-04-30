export function normalizedResumeToText(normalizedResume: any): string {
  if (!normalizedResume || typeof normalizedResume !== "object") {
    return "";
  }

  return Object.values(normalizedResume)
    .flatMap((value) => {
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return value.map((item) => JSON.stringify(item));
      if (value && typeof value === "object") return [JSON.stringify(value)];
      return [];
    })
    .join("\n");
}
