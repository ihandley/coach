import { NextResponse } from "next/server";
import { normalizeResumeWithAi } from "@/lib/resume/ai-normalizer";
import { normalizeResumeText } from "@/lib/resume/normalizer";
import { extractPdfText } from "@/lib/resume/pdf-parser";

export const runtime = "nodejs";

function isPdf(file: File) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

async function normalizeResumeForImport(text: string) {
  try {
    return (await normalizeResumeWithAi(text)) ?? normalizeResumeText(text);
  } catch (error) {
    console.error("AI resume normalization failed", error);
    throw new Error("AI resume normalization failed");
  }
}

export async function POST(req: Request) {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!isPdf(file)) {
    return NextResponse.json(
      { error: "Please upload a PDF resume." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;

  try {
    text = await extractPdfText(buffer);
  } catch (error) {
    console.error("PDF text extraction failed", error);
    return NextResponse.json(
      { error: "We could not read that PDF. Please upload a valid PDF resume." },
      { status: 400 },
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "We could not find any resume text in that PDF." },
      { status: 400 },
    );
  }

  let normalizedResume;

  try {
    normalizedResume = await normalizeResumeForImport(text);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI resume normalization failed",
      },
      { status: 502 },
    );
  }

  const originalFile = {
    name: file.name,
    type: file.type || "application/pdf",
    dataBase64: buffer.toString("base64"),
  };

  const res = await fetch(new URL("/api/resume-profiles", req.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: file.name,
      source: { kind: "pdf", label: file.name },
      normalizedResume: {
        ...normalizedResume,
        originalFile,
      },
    }),
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
