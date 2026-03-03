import type { CVFormData } from "@/lib/cv/types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

interface ClaudeTextBlock {
  text?: string;
  type?: string;
}

interface ClaudeResponse {
  content?: ClaudeTextBlock[];
  error?: {
    message?: string;
  };
}

export async function enhanceCvFormData(formData: CVFormData) {
  const careerObjective = formData.careerObjective.trim();
  const industry = formData.industry || "General";
  const experience = formData.experienceLevel || "entry";
  const targetRole =
    formData.workExperience.find((entry) => entry.role.trim())?.role
    || formData.education.find((entry) => entry.course.trim())?.course
    || "General role";

  const [enhancedObjective, suggestedSkills] = await Promise.all([
    careerObjective
      ? rewriteCareerObjective({
        experience,
        industry,
        objective: careerObjective,
      })
      : Promise.resolve(""),
    suggestSkills({
      industry,
      skills: formData.skills,
      targetRole,
    }),
  ]);

  return {
    aiEnhancedObjective: enhancedObjective || formData.aiEnhancedObjective || careerObjective,
    aiEnhancementUpdatedAt: new Date().toISOString(),
    aiSuggestedSkills: mergeSuggestedSkills(formData.skills, suggestedSkills),
  };
}

async function rewriteCareerObjective({
  experience,
  industry,
  objective,
}: {
  experience: string;
  industry: string;
  objective: string;
}) {
  const text = await sendClaudeMessage({
    maxTokens: 350,
    system:
      "You are a professional CV writer specialising in Nigerian job applications. Rewrite this career objective to be compelling, specific to the industry, and 3-4 sentences. Use professional Nigerian English. Return only the rewritten objective.",
    user: `Industry: ${industry}. Experience: ${experience}. Objective: ${objective}`,
  });

  return text.replace(/\s+/g, " ").trim();
}

async function suggestSkills({
  industry,
  skills,
  targetRole,
}: {
  industry: string;
  skills: string[];
  targetRole: string;
}) {
  const text = await sendClaudeMessage({
    maxTokens: 220,
    system:
      "You are a Nigerian career advisor. Suggest 5 skills to add to this CV for the target industry. Return a JSON array of skill strings only. No explanation.",
    user: `Industry: ${industry}. Skills: ${skills.join(", ") || "None listed"}. Target role: ${targetRole}`,
  });

  return parseSkillArray(text);
}

async function sendClaudeMessage({
  maxTokens,
  system,
  user,
}: {
  maxTokens: number;
  system: string;
  user: string;
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing.");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      max_tokens: maxTokens,
      messages: [
        {
          content: user,
          role: "user",
        },
      ],
      model: CLAUDE_MODEL,
      system,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ClaudeResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Claude request failed.");
  }

  const text = payload.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text?.trim() || "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Claude returned an empty response.");
  }

  return text;
}

function parseSkillArray(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return cleaned
      .split(/[\n,]/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
  }
}

function mergeSuggestedSkills(existingSkills: string[], suggestedSkills: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const skill of [...existingSkills, ...suggestedSkills]) {
    const normalized = skill.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(normalized);
  }

  return merged;
}
