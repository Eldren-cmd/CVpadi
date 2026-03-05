import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import satori from "satori";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { PREVIEW_CANVAS_WIDTH } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";

const DELIVERY_WIDTH = 1240;
const CV_WIDTH = 794;
const CV_HEIGHT = 1123;

const NYSC_STATUS_LABELS: Record<CVFormData["nyscStatus"], string> = {
  discharged: "Discharged",
  exempted: "Exempted",
  not_yet: "Not yet served",
  ongoing: "Ongoing",
};

type SatoriFont = {
  data: Buffer;
  name: string;
  style: "normal";
  weight: 400 | 700;
};

let satoriFonts: SatoriFont[] | null = null;

function loadFont(filename: string) {
  return readFileSync(join(process.cwd(), "public", "fonts", filename));
}

function getSatoriFonts() {
  if (satoriFonts) {
    return satoriFonts;
  }

  satoriFonts = [
    {
      data: loadFont("dm-sans-400.ttf"),
      name: "DM Sans",
      style: "normal",
      weight: 400,
    },
    {
      data: loadFont("dm-sans-700.ttf"),
      name: "DM Sans",
      style: "normal",
      weight: 700,
    },
    {
      data: loadFont("playfair-700.ttf"),
      name: "Playfair",
      style: "normal",
      weight: 700,
    },
  ];

  return satoriFonts;
}

function joinValues(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" | ");
}

function firstLines(text: string, limit = 3) {
  return text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function uniqueSkills(formData: CVFormData) {
  const seen = new Set<string>();
  const merged = [...(formData.aiSuggestedSkills ?? []), ...formData.skills];

  return merged
    .map((skill) => skill.trim())
    .filter((skill) => {
      if (!skill) {
        return false;
      }

      const key = skill.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          borderBottom: "1px solid #D8CFC1",
          color: "#D4501A",
          display: "flex",
          fontFamily: "DM Sans",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.4,
          marginBottom: 8,
          paddingBottom: 4,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function CvPreviewLayout({
  fingerprint,
  formData,
  watermarked,
}: {
  fingerprint: string;
  formData: CVFormData;
  watermarked: boolean;
}) {
  const displayObjective =
    formData.aiEnhancedObjective?.trim() ||
    formData.careerObjective.trim() ||
    "Career objective not provided yet.";
  const skills = uniqueSkills(formData);
  const location = joinValues([formData.locationCity, formData.locationState]);
  const contactLine = joinValues([formData.email, formData.phone, location]);
  const nyscStatus = NYSC_STATUS_LABELS[formData.nyscStatus];
  const experiences = formData.noExperienceYet ? [] : formData.workExperience.slice(0, 3);
  const education = formData.education.slice(0, 2);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#1A1410",
        display: "flex",
        flexDirection: "column",
        fontFamily: "DM Sans",
        height: CV_HEIGHT,
        position: "relative",
        width: CV_WIDTH,
      }}
    >
      <div
        style={{
          backgroundColor: "#D4501A",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          padding: "30px 36px 24px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            display: "flex",
            fontFamily: "Playfair",
            fontSize: 29,
            fontWeight: 700,
            letterSpacing: -0.6,
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {formData.fullName || "Your CV Name"}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            display: "flex",
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: "100%",
          }}
        >
          {contactLine || "Add your phone, email, and location."}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "22px 36px 28px",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <Section title="Career Objective">
            <div
              style={{
                color: "#3D3530",
                display: "flex",
                fontSize: 10,
                lineHeight: 1.55,
              }}
            >
              {displayObjective}
            </div>
          </Section>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            marginBottom: 14,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#D4501A",
              display: "flex",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.2,
              marginRight: 8,
              textTransform: "uppercase",
            }}
          >
            NYSC Status:
          </div>
          <div
            style={{
              backgroundColor: "#DDEEDC",
              borderRadius: 4,
              color: "#1E6B3A",
              display: "flex",
              fontSize: 9,
              padding: "2px 8px",
            }}
          >
            {nyscStatus}
          </div>
        </div>

        {skills.length ? (
          <div style={{ marginBottom: 14 }}>
            <Section title="Skills">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {skills.map((skill) => (
                  <div
                    key={skill}
                    style={{
                      backgroundColor: "#F6F2EB",
                      border: "1px solid #DED6C8",
                      borderRadius: 4,
                      color: "#3D3530",
                      display: "flex",
                      fontSize: 9,
                      marginBottom: 6,
                      marginRight: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        {experiences.length ? (
          <div style={{ marginBottom: 14 }}>
            <Section title="Work Experience">
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {experiences.map((experience) => (
                  <div
                    key={experience.id}
                    style={{ display: "flex", flexDirection: "column", marginBottom: 8 }}
                  >
                    <div
                      style={{
                        color: "#1A1410",
                        display: "flex",
                        fontSize: 10,
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {joinValues([experience.role, experience.company])}
                    </div>
                    <div
                      style={{
                        color: "#5A4D3E",
                        display: "flex",
                        fontSize: 9,
                        marginBottom: 3,
                      }}
                    >
                      {joinValues([experience.startDate, experience.endDate])}
                    </div>
                    {firstLines(experience.responsibilities).map((line, index) => (
                      <div
                        key={`${experience.id}_line_${index}`}
                        style={{
                          color: "#5A4D3E",
                          display: "flex",
                          fontSize: 9,
                          lineHeight: 1.4,
                          marginBottom: 1,
                        }}
                      >
                        - {line}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        <div style={{ marginBottom: 14 }}>
          <Section title="Education">
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              {education.map((entry) => (
                <div key={entry.id} style={{ display: "flex", flexDirection: "column", marginBottom: 6 }}>
                  <div
                    style={{
                      color: "#1A1410",
                      display: "flex",
                      fontSize: 10,
                      fontWeight: 700,
                      marginBottom: 1,
                    }}
                  >
                    {entry.institution || "Institution pending"}
                  </div>
                  <div style={{ color: "#5A4D3E", display: "flex", fontSize: 9 }}>
                    {joinValues([entry.course, entry.degreeClass, entry.year])}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <div
        style={{
          bottom: 10,
          color: "#FFFFFF",
          display: "flex",
          fontFamily: "DM Sans",
          fontSize: 1,
          left: 20,
          position: "absolute",
        }}
      >
        {fingerprint}
      </div>

      {watermarked ? (
        <div
          style={{
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        >
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div
              key={`watermark_row_${rowIndex}`}
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: rowIndex === 0 ? 120 : 18,
                width: "100%",
              }}
            >
              {Array.from({ length: 3 }).map((__, columnIndex) => (
                <div
                  key={`watermark_${rowIndex}_${columnIndex}`}
                  style={{
                    color: "rgba(212,80,26,0.13)",
                    display: "flex",
                    fontFamily: "DM Sans",
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 3.5,
                    transform: "rotate(-33deg)",
                    textTransform: "uppercase",
                  }}
                >
                  CVPadi Preview
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface RenderCvJpgOptions {
  fingerprint: string;
  formData: CVFormData;
  variant?: "delivery" | "preview";
  width?: number;
}

async function renderCvPngBuffer({
  fingerprint,
  formData,
  watermarked,
}: {
  fingerprint: string;
  formData: CVFormData;
  watermarked: boolean;
}) {
  const svg = await satori(
    <CvPreviewLayout
      fingerprint={fingerprint}
      formData={formData}
      watermarked={watermarked}
    />,
    {
      fonts: getSatoriFonts(),
      height: CV_HEIGHT,
      width: CV_WIDTH,
    },
  );

  const pngBuffer = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: CV_WIDTH,
    },
  }).render().asPng();

  return Buffer.from(pngBuffer);
}

export async function renderCvJpgBuffer({
  fingerprint,
  formData,
  variant = "delivery",
  width = DELIVERY_WIDTH,
}: RenderCvJpgOptions) {
  const pngBuffer = await renderCvPngBuffer({
    fingerprint,
    formData,
    watermarked: variant === "preview",
  });

  const targetWidth = variant === "preview" ? PREVIEW_CANVAS_WIDTH : width;

  return sharp(pngBuffer)
    .resize({ width: targetWidth })
    .jpeg({ quality: variant === "preview" ? 72 : 92 })
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
