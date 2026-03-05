import { renderToBuffer } from "@react-pdf/renderer";
import {
  DOMMatrix,
  DOMPoint,
  createCanvas,
} from "canvas";
import sharp from "sharp";
import { PREVIEW_CANVAS_WIDTH } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";
import { CVPdfDocument } from "./cv-pdf-document";

const globalScope = globalThis as unknown as Record<string, unknown>;

globalScope.DOMMatrix ??= DOMMatrix;
globalScope.DOMPoint ??= DOMPoint;

if (!globalScope.DOMRect) {
  class DOMRectPolyfill {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    public constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    public static fromRect({
      height = 0,
      width = 0,
      x = 0,
      y = 0,
    }: Partial<DOMRectPolyfill> = {}) {
      return new DOMRectPolyfill(x, y, width, height);
    }
  }

  globalScope.DOMRect = DOMRectPolyfill;
}

const DELIVERY_WIDTH = 1240;
const RENDER_SCALE = 2;
const PDF_WORKER_SRC = "pdfjs-dist/legacy/build/pdf.worker.mjs";

let pdfJsPromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfJs) => {
      pdfJs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      return pdfJs;
    });
  }

  return pdfJsPromise;
}

interface RenderCvJpgOptions {
  fingerprint: string;
  formData: CVFormData;
  variant?: "delivery" | "preview";
  width?: number;
}

async function renderFirstPagePng({
  fingerprint,
  formData,
  watermarked,
}: {
  fingerprint: string;
  formData: CVFormData;
  watermarked: boolean;
}) {
  const { getDocument } = await getPdfJs();
  const pdfBuffer = await renderToBuffer(
    <CVPdfDocument
      fingerprint={fingerprint}
      formData={formData}
      watermarked={watermarked}
    />,
  );
  const pdf = await getDocument({
    data: new Uint8Array(pdfBuffer),
  } as never).promise;

  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    const context = canvas.getContext("2d");

    await page.render({
      canvas,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    } as never).promise;

    return canvas.toBuffer("image/png");
  } finally {
    await pdf.destroy();
  }
}

export async function renderCvJpgBuffer({
  fingerprint,
  formData,
  variant = "delivery",
  width = DELIVERY_WIDTH,
}: RenderCvJpgOptions) {
  const pngBuffer = await renderFirstPagePng({
    fingerprint,
    formData,
    watermarked: variant === "preview",
  });

  const targetWidth = variant === "preview" ? PREVIEW_CANVAS_WIDTH : width;

  return sharp(pngBuffer)
    .resize({ width: targetWidth })
    .jpeg({ quality: variant === "preview" ? 70 : 92 })
    .toBuffer();
}

export async function renderCvPreviewJpeg({
  fingerprint,
  formData,
}: {
  fingerprint: string;
  formData: CVFormData;
  score?: number;
}) {
  return renderCvJpgBuffer({
    fingerprint,
    formData,
    variant: "preview",
  });
}
