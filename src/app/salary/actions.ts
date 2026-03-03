"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SalarySubmissionState {
  error?: string;
  success?: string;
}

export async function submitSalaryAction(
  _previousState: SalarySubmissionState,
  formData: FormData,
): Promise<SalarySubmissionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Verify your email with a magic link before submitting salary data.",
    };
  }

  if (!user.email_confirmed_at) {
    return {
      error: "Your email still needs verification before we can accept salary submissions.",
    };
  }

  const company = String(formData.get("company") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const locationState = String(formData.get("locationState") || "").trim();
  const annualSalaryNaira = Number(String(formData.get("annualSalaryNaira") || "0").replaceAll(",", ""));
  const yearsExperienceRaw = String(formData.get("yearsExperience") || "").trim();
  const submissionYearRaw = String(formData.get("submissionYear") || "").trim();
  const employmentType = String(formData.get("employmentType") || "full_time").trim();

  if (company.length < 2 || role.length < 2 || locationState.length < 2) {
    return {
      error: "Company, role, and state are required.",
    };
  }

  if (!Number.isFinite(annualSalaryNaira) || annualSalaryNaira < 10_000) {
    return {
      error: "Enter the annual salary in naira.",
    };
  }

  if (!["full_time", "contract", "part_time"].includes(employmentType)) {
    return {
      error: "Choose a valid employment type.",
    };
  }

  const parsedYearsExperience = yearsExperienceRaw ? Number(yearsExperienceRaw) : null;
  if (
    yearsExperienceRaw
    && (
      parsedYearsExperience === null
      || !Number.isInteger(parsedYearsExperience)
      || parsedYearsExperience < 0
      || parsedYearsExperience > 50
    )
  ) {
    return {
      error: "Years of experience must be a whole number between 0 and 50.",
    };
  }
  const yearsExperience = parsedYearsExperience;

  const currentYear = new Date().getFullYear();
  const submissionYear = submissionYearRaw ? Number(submissionYearRaw) : currentYear;
  if (
    !Number.isInteger(submissionYear)
    || submissionYear < currentYear - 15
    || submissionYear > currentYear + 1
  ) {
    return {
      error: "Use a valid submission year.",
    };
  }

  const { error } = await supabase.from("salary_submissions").insert({
    company,
    employment_type: employmentType,
    is_verified: true,
    location_state: locationState,
    role,
    salary_annual_kobo: Math.round(annualSalaryNaira * 100),
    submission_year: submissionYear,
    user_id: user.id,
    years_experience: yearsExperience,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/salary");

  return {
    success: "Salary submitted. It becomes public once five people report the same company, role, and state combination.",
  };
}
