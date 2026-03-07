import type { CVFormData } from "@/lib/cv/types";

const REFUSAL_PHRASES = [
  "i appreciate you reaching out",
  "i cannot",
  "i am unable",
  "appears to be corrupted",
  "random characters",
  "could you please provide",
  "i apologize",
  "as an ai",
  "i don't think",
  "that doesn't seem",
] as const;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean).length;
}

function getTargetRole(formData: CVFormData) {
  return (
    formData.workExperience.find((entry) => entry.role.trim())?.role.trim()
    || formData.education.find((entry) => entry.course.trim())?.course.trim()
    || ""
  );
}

export function isLikelyClaudeRefusal(text: string) {
  const lowerText = normalizeText(text).toLowerCase();
  return REFUSAL_PHRASES.some((phrase) => lowerText.includes(phrase));
}

export function isValidEnhancement(text: string, original: string) {
  const normalizedText = normalizeText(text);
  const normalizedOriginal = normalizeText(original);

  if (!normalizedText || normalizedText.length < 20) {
    return false;
  }

  if (isLikelyClaudeRefusal(normalizedText)) {
    return false;
  }

  if (countWords(normalizedText) < 20) {
    return false;
  }

  if (normalizedOriginal && normalizedText.toLowerCase() === normalizedOriginal.toLowerCase()) {
    return false;
  }

  return true;
}

export function getEnhancementSourceSignature(formData: CVFormData) {
  return JSON.stringify({
    careerObjective: normalizeText(formData.careerObjective),
    experienceLevel: normalizeText(formData.experienceLevel),
    industry: normalizeText(formData.industry),
    skills: [...(formData.skills ?? [])]
      .map((skill) => normalizeText(skill).toLowerCase())
      .filter(Boolean)
      .sort(),
    targetRole: normalizeText(getTargetRole(formData)),
  });
}

export function getDisplayObjective(formData: CVFormData) {
  const originalObjective = normalizeText(formData.careerObjective);
  const enhancedObjective = normalizeText(formData.aiEnhancedObjective ?? "");

  if (!isValidEnhancement(enhancedObjective, originalObjective)) {
    return originalObjective;
  }

  const storedSignature = normalizeText(formData.aiEnhancementSourceSignature ?? "");
  if (storedSignature && storedSignature !== getEnhancementSourceSignature(formData)) {
    return originalObjective;
  }

  return enhancedObjective || originalObjective;
}

export function formatDateOfBirth(dob: string) {
  const normalizedDob = normalizeText(dob);
  if (!normalizedDob) {
    return "";
  }

  try {
    const parsedDate = new Date(normalizedDob);
    if (Number.isNaN(parsedDate.getTime())) {
      return normalizedDob;
    }

    return parsedDate.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return normalizedDob;
  }
}
