import sharp from "sharp";
import { PREVIEW_CANVAS_WIDTH } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";
import { fontData } from "./font-data";

const WIDTH = 1240;
const HEIGHT = 1754;

let embeddedFontStyles: string | null = null;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function compact(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" | ");
}

function getDisplayObjective(formData: CVFormData) {
  return formData.aiEnhancedObjective || formData.careerObjective || "Career objective not provided yet.";
}

function getDisplaySkills(formData: CVFormData) {
  const seen = new Set<string>();

  return [...(formData.aiSuggestedSkills || []), ...formData.skills].filter((skill) => {
    const normalized = skill.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;

    if (lines.length === maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.length > 0) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].slice(0, Math.max(0, maxChars - 3))}...`;
  }

  return lines;
}

function bulletLines(text: string, maxChars: number, maxLines: number) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => wrapText(`- ${line}`, maxChars, 2))
    .slice(0, maxLines);
}

function renderLineBlock(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  fontSize = 28,
  fontFamily = "'DM Sans', sans-serif",
  fontWeight = 400,
) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${startY + (index * lineHeight)}" fill="#5C4F3D" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}">${escapeXml(line)}</text>`,
    )
    .join("");
}

function getEmbeddedFontStyles() {
  if (embeddedFontStyles) {
    return embeddedFontStyles;
  }

  const dmSansRegular = `data:font/truetype;base64,${fontData.dmSans400}`;
  const dmSansMedium = `data:font/truetype;base64,${fontData.dmSans500}`;
  const dmSansBold = `data:font/truetype;base64,${fontData.dmSans700}`;
  const playfairBold = `data:font/truetype;base64,${fontData.playfair700}`;

  embeddedFontStyles = `
    <style>
      @font-face {
        font-family: 'DM Sans';
        src: url('${dmSansRegular}') format('truetype');
        font-style: normal;
        font-weight: 400;
      }

      @font-face {
        font-family: 'DM Sans';
        src: url('${dmSansMedium}') format('truetype');
        font-style: normal;
        font-weight: 500;
      }

      @font-face {
        font-family: 'DM Sans';
        src: url('${dmSansBold}') format('truetype');
        font-style: normal;
        font-weight: 700;
      }

      @font-face {
        font-family: 'Playfair';
        src: url('${playfairBold}') format('truetype');
        font-style: normal;
        font-weight: 700;
      }
    </style>
  `;

  return embeddedFontStyles;
}

export async function renderCvJpgBuffer({
  fingerprint,
  formData,
  variant = "delivery",
  width = WIDTH,
}: {
  fingerprint: string;
  formData: CVFormData;
  variant?: "delivery" | "preview";
  width?: number;
}) {
  const displayObjective = getDisplayObjective(formData);
  const displaySkills = getDisplaySkills(formData);
  const heroMeta = compact([
    formData.locationCity,
    formData.locationState,
    formData.phone,
    formData.email,
  ]);
  const subMeta = compact([
    formData.industry,
    formData.experienceLevel,
    formData.nyscStatus ? `NYSC: ${formData.nyscStatus}` : "",
  ]);
  const objectiveLines = wrapText(displayObjective, 62, 4);
  const experienceLines = formData.noExperienceYet
    ? ["Entry-level candidate. Experience section intentionally empty."]
    : formData.workExperience.slice(0, 2).flatMap((entry) => {
      const title = compact([entry.role, entry.company]) || "Role and company pending";
      const dates = compact([entry.startDate, entry.endDate]) || "Dates pending";

      return [
        title,
        dates,
        ...bulletLines(entry.responsibilities || "Responsibilities pending.", 58, 4),
        "",
      ];
    }).filter(Boolean);
  const educationLines = formData.education.slice(0, 2).flatMap((entry) => [
    entry.institution || "Institution pending",
    compact([entry.course, entry.degreeClass, entry.year]) || "Education details pending",
  ]);
  const skillLines = wrapText([...displaySkills, ...formData.languages].join(" | ") || "Skills pending", 62, 3);
  const refereeLines = [
    compact([
      formData.refereeOne.name,
      formData.refereeOne.title,
      formData.refereeOne.company,
    ]) || "Referee 1 pending",
    compact([
      formData.refereeTwo.name,
      formData.refereeTwo.title,
      formData.refereeTwo.company,
    ]) || "Referee 2 pending",
  ];
  const watermarkValues = [
    formData.fullName || "CVPadi Preview",
    formData.phone || "Phone hidden until unlock",
    formData.email || "Email hidden until unlock",
  ];
  const watermarkTiles = variant === "preview"
    ? createPreviewWatermarks(watermarkValues)
    : "";
  const fontStyles = getEmbeddedFontStyles();

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${fontStyles}
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#F5F0E8"/>
      <rect x="56" y="56" width="${WIDTH - 112}" height="${HEIGHT - 112}" rx="28" fill="#FDFAF4"/>
      ${watermarkTiles}
      <rect x="56" y="56" width="${WIDTH - 112}" height="238" rx="28" fill="#D4501A"/>
      <text x="104" y="126" fill="#F4E4D8" font-size="24" font-family="'DM Sans', sans-serif" font-weight="500" letter-spacing="8">CVPadi</text>
      <text x="104" y="190" fill="#FFFFFF" font-size="64" font-family="'Playfair', serif" font-weight="700">${escapeXml(formData.fullName || "Your CV")}</text>
      <text x="104" y="234" fill="#FFF3EA" font-size="28" font-family="'DM Sans', sans-serif">${escapeXml(heroMeta || "Location and contact details pending")}</text>
      <text x="104" y="270" fill="#FFF3EA" font-size="24" font-family="'DM Sans', sans-serif">${escapeXml(subMeta || "Industry and experience details pending")}</text>

      <text x="104" y="366" fill="#D4501A" font-size="24" font-family="'DM Sans', sans-serif" font-weight="700" letter-spacing="4">CAREER OBJECTIVE</text>
      ${renderLineBlock(objectiveLines, 104, 412, 34)}

      <text x="104" y="598" fill="#D4501A" font-size="24" font-family="'DM Sans', sans-serif" font-weight="700" letter-spacing="4">WORK EXPERIENCE</text>
      ${renderLineBlock(experienceLines, 104, 644, 34)}

      <text x="104" y="1074" fill="#D4501A" font-size="24" font-family="'DM Sans', sans-serif" font-weight="700" letter-spacing="4">EDUCATION</text>
      ${renderLineBlock(educationLines, 104, 1120, 34)}

      <text x="104" y="1290" fill="#D4501A" font-size="24" font-family="'DM Sans', sans-serif" font-weight="700" letter-spacing="4">SKILLS</text>
      ${renderLineBlock(skillLines, 104, 1336, 34)}

      <text x="104" y="1494" fill="#D4501A" font-size="24" font-family="'DM Sans', sans-serif" font-weight="700" letter-spacing="4">REFEREES</text>
      ${renderLineBlock(refereeLines, 104, 1540, 34)}

      <text x="104" y="1672" fill="#FFFFFF" font-size="4" font-family="'DM Sans', sans-serif">${escapeXml(fingerprint)}</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .resize({ width: variant === "preview" ? PREVIEW_CANVAS_WIDTH : width })
    .jpeg({ quality: variant === "preview" ? 70 : 92 })
    .toBuffer();
}

function createPreviewWatermarks(values: string[]) {
  return Array.from({ length: 5 }, (_, rowIndex) =>
    Array.from({ length: 2 }, (_, columnIndex) => {
      const x = columnIndex === 0 ? 160 : 700;
      const y = 420 + (rowIndex * 240);

      return `
        <g transform="translate(${x} ${y}) rotate(-28)">
          <rect x="-22" y="-72" width="450" height="138" rx="22" fill="#FFFFFF" fill-opacity="0.18" />
          ${values.map((value, valueIndex) => `
            <text
              x="0"
              y="${valueIndex * 38}"
              fill="#B5442A"
              fill-opacity="0.42"
              font-size="${valueIndex === 0 ? 28 : 24}"
              font-family="'DM Sans', sans-serif"
              font-weight="700"
            >${escapeXml(value)}</text>
          `).join("")}
        </g>
      `;
    }).join("")
  ).join("");
}
