import { NextResponse } from "next/server";
import {
  extractTextFromPdfBuffer,
  scoreCvCheckInput,
} from "@/lib/cv/checker";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawText = String(formData.get("text") || "").trim();
  const pdfFile = formData.get("pdf");

  let extractedText = rawText;

  if (!extractedText && pdfFile instanceof File && pdfFile.size > 0) {
    if (pdfFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
      return NextResponse.json(
        { error: "Upload a valid PDF file." },
        { status: 400 },
      );
    }

    try {
      extractedText = await extractTextFromPdfBuffer(buffer);
    } catch {
      return NextResponse.json(
        { error: "Unable to read that PDF. Paste the CV text instead." },
        { status: 400 },
      );
    }
  }

  if (!extractedText) {
    return NextResponse.json(
      { error: "Paste CV text or upload a PDF to continue." },
      { status: 400 },
    );
  }

  const result = scoreCvCheckInput(extractedText);

  return NextResponse.json({
    preview: result.extractedText.slice(0, 800),
    score: result.score,
    suggestions: result.suggestions,
  });
}
