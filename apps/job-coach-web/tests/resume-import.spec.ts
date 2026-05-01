import { expect, test } from "@playwright/test";

function buildPdfBuffer(lines: string[]) {
  const escapePdfText = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const textCommands = ["BT", "/F1 12 Tf", "50 742 Td", "14 TL"];

  lines.forEach((line, index) => {
    if (index > 0) {
      textCommands.push("T*");
    }

    textCommands.push(`(${escapePdfText(line)}) Tj`);
  });

  textCommands.push("ET");

  const stream = textCommands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}

test("uploads, previews, and deletes a structured resume", async ({ page }) => {
  const filename = `structured-resume-${Date.now()}.pdf`;

  await page.goto("/resumes");
  await page.locator('input[type="file"]').setInputFiles({
    name: filename,
    mimeType: "application/pdf",
    buffer: buildPdfBuffer([
      "Ian Handley",
      "ian@example.com",
      "Skills",
      "TypeScript, React",
      "Experience",
      "Senior Engineer at Acme",
      "- Built reliable import workflows",
      "Education",
      "University of Utah - BS Computer Science",
    ]),
  });

  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(filename)).toBeVisible();

  await page.getByRole("button", { name: `Preview ${filename}` }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ian Handley" })).toBeVisible();
  await expect(page.getByText("ian@example.com")).toBeVisible();
  await expect(page.getByText("TypeScript")).toBeVisible();
  await expect(page.getByText("Senior Engineer at Acme")).toBeVisible();
  await expect(page.getByText("University of Utah")).toBeVisible();
  await expect(page.getByText(/"rawText"/)).toHaveCount(0);

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: `Delete ${filename}` }).click();
  await expect(page.getByText(filename)).toHaveCount(0);
});
