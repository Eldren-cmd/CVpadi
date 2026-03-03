export type EmailFrequency = "normal" | "less_often" | "jobs_only";

export interface EmailPreferences {
  frequency: EmailFrequency;
  unsubscribeAll: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  frequency: "normal",
  unsubscribeAll: false,
};

function isEmailFrequency(value: unknown): value is EmailFrequency {
  return value === "normal" || value === "less_often" || value === "jobs_only";
}

export function extractEmailPreferences(metadata: unknown): EmailPreferences {
  if (!metadata || typeof metadata !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const emailPreferences = (metadata as { email_preferences?: unknown }).email_preferences;

  if (!emailPreferences || typeof emailPreferences !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const frequency = (emailPreferences as { frequency?: unknown }).frequency;
  const unsubscribeAll = (emailPreferences as { unsubscribeAll?: unknown }).unsubscribeAll;

  return {
    frequency: isEmailFrequency(frequency) ? frequency : DEFAULT_PREFERENCES.frequency,
    unsubscribeAll: typeof unsubscribeAll === "boolean"
      ? unsubscribeAll
      : DEFAULT_PREFERENCES.unsubscribeAll,
  };
}

export function getDefaultEmailPreferences() {
  return DEFAULT_PREFERENCES;
}
