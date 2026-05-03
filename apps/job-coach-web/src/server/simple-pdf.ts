function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(objects: string[]) {
  const encoder = new TextEncoder();

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` + `startxref\n${xrefOffset}\n%%EOF`;

  const bytes = encoder.encode(pdf);

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function renderSimplePdf(input: { title: string; lines: string[]; fileName: string }) {
  const safeLines = input.lines.length > 0 ? input.lines : [""];

  const textCommands: string[] = ["BT", "/F1 12 Tf", "50 742 Td", "14 TL"];

  for (let index = 0; index < safeLines.length; index += 1) {
    const line = escapePdfText(safeLines[index] ?? "");

    if (index === 0) {
      textCommands.push(`(${line}) Tj`);
    } else {
      textCommands.push("T*");
      textCommands.push(`(${line}) Tj`);
    }
  }

  textCommands.push("ET");

  const stream = textCommands.join("\n");
  const streamLength = new TextEncoder().encode(stream).length;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  return {
    fileName: input.fileName,
    mimeType: "application/pdf",
    buffer: buildPdf(objects),
  };
}
