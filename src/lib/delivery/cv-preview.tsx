import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import satori from "satori";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { formatDateOfBirth, getDisplayObjective } from "@/lib/ai/enhancement-utils";
import { PREVIEW_CANVAS_WIDTH } from "@/lib/cv/constants";
import type { CVFormData, DegreeClass, ExperienceLevel, NyscStatus } from "@/lib/cv/types";

const DELIVERY_WIDTH = 1240;
const CV_WIDTH = 794;

const GRADE_LABELS: Record<DegreeClass, string> = {
  credit: "Credit",
  distinction: "Distinction",
  first_class: "First Class",
  merit: "Merit",
  other: "Other",
  pass: "Pass",
  second_class_lower: "Second Class Lower",
  second_class_upper: "Second Class Upper",
  third_class: "Third Class",
};

const NYSC_STATUS_LABELS: Record<NyscStatus, string> = {
  discharged: "Discharged",
  exempted: "Exempted",
  not_yet: "Not yet served",
  ongoing: "Currently serving",
};

const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry level",
  executive: "Executive",
  mid: "Mid level",
  senior: "Senior level",
};

type SatoriFont = {
  data: Buffer;
  name: string;
  style: "normal";
  weight: 400 | 700;
};

type LooseRecord = Record<string, unknown>;

interface PreviewEducation {
  course: string;
  degreeClass: string;
  id: string;
  institution: string;
  year: string;
}

interface PreviewExperience {
  company: string;
  endDate: string;
  id: string;
  responsibilities: string;
  role: string;
  startDate: string;
}

interface PreviewCertification {
  id: string;
  issuer: string;
  name: string;
  year: string;
}

interface PreviewReferee {
  company: string;
  email: string;
  name: string;
  phone: string;
  title: string;
}

interface RenderCvJpgOptions {
  fingerprint: string;
  formData: CVFormData;
  variant?: "delivery" | "preview";
  width?: number;
}

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

function getRecord(value: unknown): LooseRecord {
  if (value && typeof value === "object") {
    return value as LooseRecord;
  }

  return {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(record: LooseRecord, keys: string[]) {
  for (const key of keys) {
    const value = getString(record[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => getString(item))
    .filter(Boolean);
}

function joinValues(values: Array<string | null | undefined>, separator = " · ") {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(separator);
}

function formatGrade(value: string) {
  return GRADE_LABELS[value as DegreeClass] || value.replace(/_/g, " ");
}

function formatNysc(value: string) {
  return NYSC_STATUS_LABELS[value as NyscStatus] || value.replace(/_/g, " ");
}

function formatExperience(value: string) {
  return EXPERIENCE_LEVEL_LABELS[value as ExperienceLevel] || value.replace(/_/g, " ");
}

function hasRefereeContent(referee: PreviewReferee) {
  return Boolean(
    referee.name || referee.title || referee.company || referee.phone || referee.email,
  );
}

function getEducation(formData: CVFormData, source: LooseRecord) {
  const rawEntries = Array.isArray(source.education) ? source.education : formData.education;

  if (!Array.isArray(rawEntries)) {
    return [] as PreviewEducation[];
  }

  return rawEntries
    .map((entry, index) => {
      const item = getRecord(entry);

      return {
        course: getOptionalString(item, ["course", "course_of_study", "courseOfStudy"]),
        degreeClass: getOptionalString(item, ["degreeClass", "degree_class"]),
        id: getOptionalString(item, ["id"]) || `edu_${index}`,
        institution: getOptionalString(item, ["institution", "school"]),
        year: getOptionalString(item, ["year", "graduationYear", "graduation_year"]),
      };
    })
    .filter((entry) =>
      Boolean(entry.institution || entry.course || entry.degreeClass || entry.year),
    );
}

function getWorkExperience(formData: CVFormData, source: LooseRecord) {
  const noExperienceYet =
    Boolean(source.no_experience_yet) || Boolean(source.noExperienceYet) || formData.noExperienceYet;
  if (noExperienceYet) {
    return [] as PreviewExperience[];
  }

  const rawEntries = Array.isArray(source.work_experience)
    ? source.work_experience
    : formData.workExperience;

  if (!Array.isArray(rawEntries)) {
    return [] as PreviewExperience[];
  }

  return rawEntries
    .map((entry, index) => {
      const item = getRecord(entry);

      return {
        company: getOptionalString(item, ["company"]),
        endDate: getOptionalString(item, ["endDate", "end_date"]),
        id: getOptionalString(item, ["id"]) || `exp_${index}`,
        responsibilities: getOptionalString(item, [
          "responsibilities",
          "description",
          "achievements",
        ]),
        role: getOptionalString(item, ["role", "position"]),
        startDate: getOptionalString(item, ["startDate", "start_date"]),
      };
    })
    .filter((entry) =>
      Boolean(
        entry.company ||
        entry.role ||
        entry.startDate ||
        entry.endDate ||
        entry.responsibilities,
      ),
    );
}

function getCertifications(formData: CVFormData, source: LooseRecord) {
  const rawEntries = Array.isArray(source.certifications)
    ? source.certifications
    : formData.certifications;

  if (!Array.isArray(rawEntries)) {
    return [] as PreviewCertification[];
  }

  return rawEntries
    .map((entry, index) => {
      const item = getRecord(entry);

      return {
        id: getOptionalString(item, ["id"]) || `cert_${index}`,
        issuer: getOptionalString(item, ["issuer", "issuing_body", "issuingBody"]),
        name: getOptionalString(item, ["name"]),
        year: getOptionalString(item, ["year"]),
      };
    })
    .filter((entry) => Boolean(entry.name || entry.issuer || entry.year));
}

function getReferees(formData: CVFormData, source: LooseRecord) {
  const arraySource = Array.isArray(source.referees) ? source.referees : null;
  const fallback = [formData.refereeOne, formData.refereeTwo];
  const rawEntries = arraySource ?? fallback;

  if (!Array.isArray(rawEntries)) {
    return [] as PreviewReferee[];
  }

  return rawEntries
    .map((entry) => {
      const item = getRecord(entry);

      return {
        company: getOptionalString(item, ["company"]),
        email: getOptionalString(item, ["email"]),
        name: getOptionalString(item, ["name"]),
        phone: getOptionalString(item, ["phone"]),
        title: getOptionalString(item, ["title"]),
      };
    })
    .filter(hasRefereeContent)
    .slice(0, 2);
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
    });
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
          borderBottom: "0.5px solid #D4501A",
          color: "#D4501A",
          display: "flex",
          fontFamily: "DM Sans",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          marginBottom: 6,
          paddingBottom: 3,
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
  const source = getRecord(formData as unknown);
  const displayObjective = getDisplayObjective(formData);
  const location = joinValues([formData.locationCity, formData.locationState], ", ");
  const contactLine = joinValues([formData.email, formData.phone, location], " · ");
  const dateOfBirth = formatDateOfBirth(
    getOptionalString(source, ["dateOfBirth", "date_of_birth"]) || formData.dateOfBirth.trim(),
  );
  const stateOfOrigin = getOptionalString(source, ["stateOfOrigin", "state_of_origin"]);
  const headerMetaLine = joinValues(
    [
      dateOfBirth ? `Date of birth: ${dateOfBirth}` : "",
      stateOfOrigin ? `State of origin: ${stateOfOrigin}` : "",
    ],
    " | ",
  );
  const profileSummary = joinValues(
    [
      `Experience level: ${formatExperience(formData.experienceLevel)}`,
      `NYSC: ${formatNysc(formData.nyscStatus)}`,
    ],
    " · ",
  );
  const skills = uniqueSkills(formData);
  const education = getEducation(formData, source);
  const workExperience = getWorkExperience(formData, source);
  const certifications = getCertifications(formData, source);
  const referees = getReferees(formData, source);
  const languages = normalizeStringArray(source.languages ?? formData.languages);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#1A1410",
        display: "flex",
        flexDirection: "column",
        fontFamily: "DM Sans",
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
          padding: "28px 40px 20px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            display: "flex",
            fontFamily: "Playfair",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: -0.4,
            lineHeight: 1.1,
            marginBottom: 6,
          }}
        >
          {formData.fullName.trim()}
        </div>
        {contactLine ? (
          <div
            style={{
              color: "rgba(255,255,255,0.92)",
              display: "flex",
              fontSize: 10,
              lineHeight: 1.35,
              marginBottom: 2,
            }}
          >
            {contactLine}
          </div>
        ) : null}
        {headerMetaLine ? (
          <div
            style={{
              color: "rgba(255,255,255,0.92)",
              display: "flex",
              fontSize: 10,
              lineHeight: 1.35,
            }}
          >
            {headerMetaLine}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "24px 40px 40px",
          width: "100%",
        }}
      >
        {profileSummary ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Professional Details">
              <div
                style={{
                  color: "#3D3530",
                  display: "flex",
                  fontSize: 10,
                  lineHeight: 1.5,
                }}
              >
                {profileSummary}
              </div>
            </Section>
          </div>
        ) : null}

        {displayObjective ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Career Objective">
              <div
                style={{
                  color: "#3D3530",
                  display: "flex",
                  fontSize: 10,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {displayObjective}
              </div>
            </Section>
          </div>
        ) : null}

        {workExperience.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Work Experience">
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {workExperience.map((entry) => (
                  <div
                    key={entry.id}
                    style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}
                  >
                    {entry.company ? (
                      <div
                        style={{
                          color: "#1A1410",
                          display: "flex",
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {entry.company}
                      </div>
                    ) : null}
                    {entry.role ? (
                      <div
                        style={{
                          color: "#D4501A",
                          display: "flex",
                          fontSize: 10,
                          marginBottom: 2,
                        }}
                      >
                        {entry.role}
                      </div>
                    ) : null}
                    {joinValues([entry.startDate, entry.endDate], " – ") ? (
                      <div
                        style={{
                          color: "#5C4F3D",
                          display: "flex",
                          fontSize: 10,
                          marginBottom: 3,
                        }}
                      >
                        {joinValues([entry.startDate, entry.endDate], " – ")}
                      </div>
                    ) : null}
                    {entry.responsibilities
                      .split(/\r?\n/)
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, index) => (
                        <div
                          key={`${entry.id}_line_${index}`}
                          style={{
                            color: "#3D3530",
                            display: "flex",
                            fontSize: 10,
                            lineHeight: 1.5,
                          }}
                        >
                          {line}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        {education.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Education">
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {education.map((entry) => (
                  <div
                    key={entry.id}
                    style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}
                  >
                    {entry.institution ? (
                      <div
                        style={{
                          color: "#1A1410",
                          display: "flex",
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {entry.institution}
                      </div>
                    ) : null}
                    {joinValues(
                      [
                        entry.course,
                        entry.degreeClass ? formatGrade(entry.degreeClass) : "",
                        entry.year,
                      ],
                      " | ",
                    ) ? (
                      <div
                        style={{
                          color: "#5C4F3D",
                          display: "flex",
                          fontSize: 10,
                        }}
                      >
                        {joinValues(
                          [
                            entry.course,
                            entry.degreeClass ? formatGrade(entry.degreeClass) : "",
                            entry.year,
                          ],
                          " | ",
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Skills">
              <div style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
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

        {languages.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Languages">
              <div style={{ color: "#3D3530", display: "flex", fontSize: 10, lineHeight: 1.5 }}>
                {languages.join(", ")}
              </div>
            </Section>
          </div>
        ) : null}

        {certifications.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Certifications">
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                {certifications.map((entry) => (
                  <div
                    key={entry.id}
                    style={{ display: "flex", flexDirection: "column", marginBottom: 10 }}
                  >
                    {entry.name ? (
                      <div
                        style={{
                          color: "#1A1410",
                          display: "flex",
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {entry.name}
                      </div>
                    ) : null}
                    {joinValues([entry.issuer, entry.year], " | ") ? (
                      <div style={{ color: "#5C4F3D", display: "flex", fontSize: 10 }}>
                        {joinValues([entry.issuer, entry.year], " | ")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        {referees.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <Section title="Referees">
              <div style={{ display: "flex", width: "100%" }}>
                {referees.map((entry, index) => (
                  <div
                    key={`ref_${index}`}
                    style={{
                      display: "flex",
                      flex: 1,
                      flexDirection: "column",
                      marginRight: index === 0 ? 14 : 0,
                    }}
                  >
                    {entry.name ? (
                      <div
                        style={{
                          color: "#1A1410",
                          display: "flex",
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {entry.name}
                      </div>
                    ) : null}
                    {joinValues([entry.title, entry.company], " | ") ? (
                      <div style={{ color: "#5C4F3D", display: "flex", fontSize: 10, marginBottom: 2 }}>
                        {joinValues([entry.title, entry.company], " | ")}
                      </div>
                    ) : null}
                    {joinValues([entry.phone, entry.email], " | ") ? (
                      <div style={{ color: "#3D3530", display: "flex", fontSize: 10 }}>
                        {joinValues([entry.phone, entry.email], " | ")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}
      </div>

      <div
        style={{
          bottom: 8,
          color: "#FFFFFF",
          display: "flex",
          fontFamily: "DM Sans",
          fontSize: 1,
          left: 16,
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
          {Array.from({ length: 4 }).map((_, rowIndex) => (
            <div
              key={`watermark_row_${rowIndex}`}
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                marginTop: rowIndex === 0 ? 140 : 120,
                width: "100%",
              }}
            >
              <div
                style={{
                  color: "rgba(212,80,26,0.08)",
                  display: "flex",
                  fontFamily: "DM Sans",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 4,
                  transform: "rotate(-35deg)",
                  textTransform: "uppercase",
                }}
              >
                CVPadi Preview
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
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

