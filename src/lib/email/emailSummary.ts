export interface EmailScanSummary {
  totalScanned: number;
  totalMatched: number;
  totalActionable: number;
}

export function buildEmailSummary(results: any[]): EmailScanSummary {
  return {
    totalScanned: results.length,
    totalMatched: results.filter((r) => r.match).length,
    totalActionable: results.filter((r) => r.isActionable).length,
  };
}
