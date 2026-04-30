type Props = {
  totalScanned: number;
  totalMatched: number;
  totalActionable: number;
};

export function EmailSummary({ totalScanned, totalMatched, totalActionable }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div>Scanned: {totalScanned}</div>
      <div>Matched: {totalMatched}</div>
      <div>Actionable: {totalActionable}</div>
    </div>
  );
}
