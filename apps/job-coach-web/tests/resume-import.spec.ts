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
      "Senior Software Engineer — Go, Distributed Systems, Cloud (AWS/GCP) — Open to Remote",
      "Spanish Fork, UT • ianhandley@gmail.com • (605) 415-2577 • linkedin.com/in/ianrhandley",
      "SUMMARY",
      "Senior Software Engineer building backend systems.",
      "CORE SKILLS",
      "Languages: Go, C#, JavaScript, Python • Systems: Distributed Systems, Microservices, Messaging",
      "Cloud: AWS, GCP, Azure",
      "PROFESSIONAL EXPERIENCE",
      "Equifax — Senior Software Engineer (Jan 2023 – Apr 2026)",
      "• Owned Go-based backend services supporting high-volume chargeback systems",
      "Optilogic — Senior Software Engineer (Sep 2022 – Nov 2022)",
      "• Developed microservices and APIs supporting supply chain optimization platforms",
      "Nu Skin — Senior Software Engineer (Aug 2019 – Aug 2022)",
      "• Maintained messaging platform processing large-scale business-critical transactions",
      "ActiveCare — System Engineer (May 2013 – Aug 2019)",
      "• Architected big-data platform processing millions of insurance claims",
      "United States Air Force — Data Integrity Analyst (Jul 2008 – Oct 2011)",
      "• Improved aircraft maintenance data accuracy",
      "Computer Research, Inc. — Software Engineer (Jan 2002 – Aug 2005)",
      "• Built financial systems supporting trading platforms using SQL Server",
      "Education",
      "University of Colorado, Denver — Bachelor’s Degree, Sociology",
      "Community College of the Air Force — Associate of Applied Science, Avionics",
    ]),
  });

  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(filename)).toBeVisible();

  await page.getByRole("button", { name: `Preview ${filename}` }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ian Handley" })).toBeVisible();
  await expect(
    page.getByText(/Senior Software Engineer.*Open to Remote/),
  ).toBeVisible();
  await expect(page.getByText("Spanish Fork, UT")).toBeVisible();
  await expect(page.getByText("ianhandley@gmail.com")).toBeVisible();
  await expect(page.getByText("linkedin.com/in/ianrhandley")).toBeVisible();
  await expect(
    page.getByText(
      "Senior Software Engineer building backend systems.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Languages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Systems" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cloud" })).toBeVisible();
  await expect(page.getByText("Go", { exact: true })).toBeVisible();
  await expect(page.getByText("Senior Software Engineer at Equifax")).toBeVisible();
  await expect(page.getByText("Senior Software Engineer at Optilogic")).toBeVisible();
  await expect(page.getByText("Senior Software Engineer at Nu Skin")).toBeVisible();
  await expect(page.getByText("System Engineer at ActiveCare")).toBeVisible();
  await expect(page.getByText("Data Integrity Analyst at United States Air Force")).toBeVisible();
  await expect(page.getByText("Software Engineer at Computer Research, Inc.")).toBeVisible();
  await expect(page.getByText("University of Colorado, Denver")).toBeVisible();
  await expect(page.getByText("Community College of the Air Force")).toBeVisible();
  await expect(page.getByText(/"rawText"/)).toHaveCount(0);

  await page.getByRole("button", { name: "Close" }).click();

  await page.goto("/jobs/00000000-0000-4000-8000-000000000001");
  await expect(page.getByLabel("Resume")).toContainText(filename);
  await page.getByLabel("Resume").selectOption({ label: filename });
  await page.getByRole("button", { name: "Tailor Resume" }).click();
  await expect(page.getByText(`Tailor Resume completed for ${filename}`)).toBeVisible();

  await page.goto("/resumes");
  await page.getByRole("button", { name: `Delete ${filename}` }).click();
  await expect(page.getByText(filename)).toHaveCount(0);
});

test("invalid file type shows an error", async ({ page }) => {
  await page.goto("/resumes");
  await page.locator('input[type="file"]').setInputFiles({
    name: "resume.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Ian Handley\nTypeScript"),
  });

  await page.getByRole("button", { name: "Import" }).click();

  await expect(page.getByText("Please upload a PDF resume.")).toBeVisible();
});

test("empty PDF shows an error", async ({ page }) => {
  await page.goto("/resumes");
  await page.locator('input[type="file"]').setInputFiles({
    name: "empty-resume.pdf",
    mimeType: "application/pdf",
    buffer: buildPdfBuffer([]),
  });

  await page.getByRole("button", { name: "Import" }).click();

  await expect(
    page.getByText("We could not find any resume text in that PDF."),
  ).toBeVisible();
});

test("malformed PDF shows an error", async ({ page }) => {
  await page.goto("/resumes");
  await page.locator('input[type="file"]').setInputFiles({
    name: "broken-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nnot actually a readable pdf"),
  });

  await page.getByRole("button", { name: "Import" }).click();

  await expect(
    page.getByText("We could not read that PDF. Please upload a valid PDF resume."),
  ).toBeVisible();
});
