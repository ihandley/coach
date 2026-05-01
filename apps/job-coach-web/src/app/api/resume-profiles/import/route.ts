import { NextResponse } from "next/server";
import { normalizeResumeWithAi } from "@/lib/resume/ai-normalizer";
import { normalizeResumeText } from "@/lib/resume/normalizer";
import { extractPdfText } from "@/lib/resume/pdf-parser";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractPdfText(buffer);
  const aiNormalizedResume = await normalizeResumeWithAi(text);
  const originalFile = {
    name: file.name,
    type: file.type || "application/pdf",
    dataBase64: buffer.toString("base64"),
  };
  const normalizedResume = {
    ...(aiNormalizedResume ?? normalizeResumeText(text)),
    originalFile,
  };

  const res = await fetch(new URL("/api/resume-profiles", req.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: file.name,
      source: { kind: "import", label: file.name },
      normalizedResume,
    }),
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
