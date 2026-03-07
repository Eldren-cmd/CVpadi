import {
  createCertificationEntry,
  createDefaultCVFormData,
  createEducationEntry,
  createExperienceEntry,
  NIGERIAN_CITIES,
  NIGERIAN_STATES,
} from "./constants";
import { computeCVScore } from "./score";
import type { CVFormData } from "./types";

const SECTION_PATTERNS: Record<string, RegExp> = {
  careerObjective:
    /(?:career objective|professional summary|profile summary|objective)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:education|experience|work experience|employment history|skills|certifications|languages|referees?)\b|$)/i,
  education:
    /(?:education|academic background|qualifications)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:experience|work experience|employment history|skills|certifications|languages|referees?)\b|$)/i,
  workExperience:
    /(?:work experience|professional experience|employment history|experience)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:education|skills|certifications|languages|referees?)\b|$)/i,
  skills:
    /(?:skills|core competencies|technical skills)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:education|experience|work experience|employment history|certifications|languages|referees?)\b|$)/i,
  certifications:
    /(?:certifications|certificates|licenses)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:education|experience|work experience|employment history|skills|languages|referees?)\b|$)/i,
  languages:
    /(?:languages|language proficiency)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:education|experience|work experience|employment history|skills|certifications|referees?)\b|$)/i,
};

const EDUCATION_HINTS = [
  "university",
  "polytechnic",
  "college",
  "b.sc",
  "b.eng",
  "hnd",
  "ond",
  "mba",
  "secondary school",
];

const EXPERIENCE_HINTS = [
  "intern",
  "associate",
  "officer",
  "manager",
  "analyst",
  "assistant",
  "specialist",
  "lead",
];

export function scoreCvCheckInput(rawText: string) {
  const normalizedText = normalizeWhitespace(rawText);
  const formData = mapRawTextToCvFormData(normalizedText);
  const scoreResult = computeCVScore(formData);

  return {
    extractedText: normalizedText,
    formData,
    score: scoreResult.score,
    suggestions: scoreResult.suggestions.slice(0, 5),
  };
}

function mapRawTextToCvFormData(rawText: string): CVFormData {
  const formData = createDefaultCVFormData(extractEmail(rawText) ?? "");
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  formData.fullName = extractFullName(lines);
  formData.phone = extractPhone(rawText) ?? "";
  formData.email = extractEmail(rawText) ?? "";
  formData.locationState = extractState(rawText);
  formData.locationCity = extractCity(rawText, formData.locationState);
  formData.dateOfBirth = extractDateOfBirth(rawText) ?? "";
  formData.industry = inferIndustry(rawText);
  formData.experienceLevel = inferExperienceLevel(rawText);
  formData.nyscStatus = inferNyscStatus(rawText);
  formData.careerObjective = extractSection(rawText, "careerObjective");
  formData.education = parseEducation(rawText);
  formData.workExperience = parseExperience(rawText);
  formData.noExperienceYet = formData.workExperience.every(
    (entry) => !entry.company && !entry.role && !entry.responsibilities,
  );
  formData.skills = parseInlineList(extractSection(rawText, "skills"));
  formData.certifications = parseCertifications(rawText);
  formData.languages = parseInlineList(extractSection(rawText, "languages"));

  return formData;
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFullName(lines: string[]) {
  const candidate = lines.find(
    (line) =>
      !line.includes("@")
      && !/\d{7,}/.test(line)
      && line.split(" ").length >= 2
      && line.split(" ").length <= 4
      && line.length <= 48,
  );

  return candidate ?? "";
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

function extractPhone(text: string) {
  const match = text.match(/(?:\+234|0)(?:7|8|9)\d{9}/);
  return match?.[0] ?? null;
}

function extractState(text: string) {
  const lowerText = text.toLowerCase();
  return (
    NIGERIAN_STATES.find((stateName) => lowerText.includes(stateName.toLowerCase()))
    ?? ""
  );
}

function extractCity(text: string, state: string) {
  const lowerText = text.toLowerCase();
  const scopedCities = state ? NIGERIAN_CITIES[state] ?? [] : Object.values(NIGERIAN_CITIES).flat();

  return scopedCities.find((cityName) => lowerText.includes(cityName.toLowerCase())) ?? "";
}

function extractDateOfBirth(text: string) {
  const match = text.match(
    /(?:date of birth|dob)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
  );

  if (!match?.[1]) {
    return null;
  }

  const rawValue = match[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const [first, second, third] = rawValue.split(/[/-]/);
  const year = third.length === 2 ? `19${third}` : third;
  return `${year}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
}

function inferIndustry(text: string) {
  const lowerText = text.toLowerCase();
  const mappings: Array<{ industry: CVFormData["industry"]; keywords: string[] }> = [
    { industry: "Technology", keywords: ["software", "developer", "frontend", "backend", "data"] },
    { industry: "Finance", keywords: ["finance", "bank", "accounting", "audit", "treasury"] },
    { industry: "Consulting", keywords: ["consulting", "strategy", "advisory"] },
    { industry: "Education", keywords: ["teacher", "school", "education", "lecturer"] },
    { industry: "Healthcare", keywords: ["medical", "hospital", "nurse", "health"] },
    { industry: "Manufacturing", keywords: ["manufacturing", "factory", "production"] },
    { industry: "Energy", keywords: ["oil", "gas", "energy", "power"] },
    { industry: "Telecommunications", keywords: ["telecom", "network", "communications"] },
    { industry: "Public Sector", keywords: ["government", "public service", "civil service"] },
    { industry: "Nonprofit", keywords: ["ngo", "nonprofit", "foundation", "development sector"] },
  ];

  return (
    mappings.find(({ keywords }) => keywords.some((keyword) => lowerText.includes(keyword)))
      ?.industry ?? ""
  );
}

function inferExperienceLevel(text: string): CVFormData["experienceLevel"] {
  const lowerText = text.toLowerCase();
  const yearsMatch = lowerText.match(/(\d+)\+?\s+years?/);
  const years = yearsMatch ? Number(yearsMatch[1]) : 0;

  if (years >= 10 || /\b(head|director|executive)\b/.test(lowerText)) {
    return "executive";
  }

  if (years >= 6 || /\b(senior|lead)\b/.test(lowerText)) {
    return "senior";
  }

  if (years >= 2 || /\b(associate|officer|analyst|specialist)\b/.test(lowerText)) {
    return "mid";
  }

  return "entry";
}

function inferNyscStatus(text: string): CVFormData["nyscStatus"] {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("nysc discharged")) return "discharged";
  if (lowerText.includes("nysc exempt") || lowerText.includes("exemption")) return "exempted";
  if (lowerText.includes("nysc ongoing") || lowerText.includes("serving")) return "ongoing";

  return "not_yet";
}

function extractSection(text: string, section: keyof typeof SECTION_PATTERNS) {
  const match = text.match(SECTION_PATTERNS[section]);
  return match?.[1]?.trim() ?? "";
}

function parseEducation(text: string) {
  const section = extractSection(text, "education");
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidateLines = lines.filter((line) =>
    EDUCATION_HINTS.some((hint) => line.toLowerCase().includes(hint)),
  );

  if (candidateLines.length === 0) {
    return [createEducationEntry()];
  }

  return candidateLines.slice(0, 2).map((line) => {
    const entry = createEducationEntry();
    entry.institution = line;
    entry.course = line;
    entry.year = extractYear(line) ?? "";
    return entry;
  });
}

function parseExperience(text: string) {
  const section = extractSection(text, "workExperience");
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidateLines = lines.filter((line) =>
    EXPERIENCE_HINTS.some((hint) => line.toLowerCase().includes(hint)),
  );

  if (candidateLines.length === 0) {
    return [createExperienceEntry()];
  }

  return candidateLines.slice(0, 2).map((line) => {
    const entry = createExperienceEntry();
    entry.company = line;
    entry.role = line;
    entry.responsibilities = line;
    return entry;
  });
}

function parseCertifications(text: string) {
  const section = extractSection(text, "certifications");
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [createCertificationEntry()];
  }

  return lines.slice(0, 2).map((line) => {
    const entry = createCertificationEntry();
    entry.name = line;
    entry.issuer = line;
    entry.year = extractYear(line) ?? "";
    return entry;
  });
}

function parseInlineList(section: string) {
  if (!section) {
    return [];
  }

  return section
    .split(/\n|,|\u2022|\||;/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function extractYear(value: string) {
  return value.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buffer: Buffer) => Promise<{ text: string }>;
  const parsed = await pdfParse(buffer);
  return parsed.text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
