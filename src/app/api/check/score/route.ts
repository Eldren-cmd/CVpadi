import { NextResponse } from "next/server";
import { scoreCvCheckInput } from "@/lib/cv/checker";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let extractedText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const pdfFile = formData.get("file") ?? formData.get("pdf");
      extractedText = String(formData.get("text") || "").trim();

      if (!extractedText && pdfFile instanceof File && pdfFile.size > 0) {
        if (pdfFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "PDF must be 5MB or smaller." },
            { status: 400 },
          );
        }

        if (pdfFile.type === "application/pdf") {
          const buffer = Buffer.from(await pdfFile.arrayBuffer());
          if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
            return NextResponse.json(
              { error: "Upload a valid PDF file." },
              { status: 400 },
            );
          }

          try {
            const { PDFParse } = await import("pdf-parse");
            const parser = new PDFParse({ data: buffer });
            const parsed = await parser.getText();
            await parser.destroy();
            extractedText = parsed.text?.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").trim() ?? "";
          } catch (pdfError) {
            console.error("PDF parse error:", pdfError);
            return NextResponse.json(
              { error: "Unable to read that PDF. Paste the CV text instead." },
              { status: 400 },
            );
          }
        } else {
          extractedText = (await pdfFile.text()).trim();
        }
      }
    } else {
      const body = (await request.json().catch(() => null)) as
        | { content?: string; text?: string }
        | null;
      extractedText = String(body?.text ?? body?.content ?? "").trim();
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
  } catch (error) {
    console.error("CV check error:", error);
    return NextResponse.json(
      { error: "Unable to score this CV right now. Please try again." },
      { status: 500 },
    );
  }
}
