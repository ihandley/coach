export function extractDomain(from: string): string | null {
  const match = from.match(/@([a-zA-Z0-9.-]+)/);
  return match ? match[1].toLowerCase() : null;
}
