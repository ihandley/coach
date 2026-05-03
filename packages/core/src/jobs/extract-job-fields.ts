export function extractJobFields(text: string) {
  const lines = text
    .split(/\n| {2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  const linkedInTitle = parseLinkedInTitle(lines[0] ?? "");

  if (linkedInTitle) {
    return linkedInTitle;
  }

  return {
    title: lines[0] || "Unknown Role",
    company: lines.find((line) => line.length < 80 && line !== lines[0]) || "Unknown",
  };
}

function parseLinkedInTitle(title: string): { title: string; company: string } | null {
  const match = title.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+.+?)?\s+\|\s+LinkedIn$/i);

  if (!match) {
    return null;
  }

  return {
    company: match[1].trim(),
    title: match[2].trim(),
  };
}
