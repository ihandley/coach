export function extractJobFields(text: string) {
  const lines = text
    .split(/\n| {2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: lines[0] || "Unknown Role",
    company: lines.find((line) => line.length < 80 && line !== lines[0]) || "Unknown",
  };
}
