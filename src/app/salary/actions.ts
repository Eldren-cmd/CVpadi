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

  const normalizedCompany = company.toLowerCase();
  const normalizedRole = role.toLowerCase();
  const normalizedState = locationState.toLowerCase();

  const { data: userSubmissions, error: existingSubmissionError } = await supabase
    .from("salary_submissions")
    .select("company, role, location_state")
    .eq("user_id", user.id);

  if (existingSubmissionError) {
    return {
      error: existingSubmissionError.message,
    };
  }

  const duplicateSubmission = (userSubmissions ?? []).some((submission) =>
    submission.company.trim().toLowerCase() === normalizedCompany
    && submission.role.trim().toLowerCase() === normalizedRole
    && (submission.location_state?.trim().toLowerCase() ?? "") === normalizedState,
  );

  if (duplicateSubmission) {
    return {
      error: "You already submitted salary data for this company, role, and state.",
    };
  }

  const { data: peerRows, error: peerRowsError } = await supabase
    .from("salary_submissions")
    .select("salary_annual_kobo")
    .ilike("company", company)
    .ilike("role", role)
    .eq("location_state", locationState);

  if (peerRowsError) {
    return {
      error: peerRowsError.message,
    };
  }

  if ((peerRows ?? []).length > 0) {
    const medianAnnualKobo = calculateMedian(
      peerRows
        .map((row) => Number(row.salary_annual_kobo))
        .filter((value) => Number.isFinite(value) && value > 0),
    );

    if (medianAnnualKobo > 0) {
      const proposedAnnualKobo = Math.round(annualSalaryNaira * 100);
      const lowerBound = Math.round(medianAnnualKobo * 0.3);
      const upperBound = Math.round(medianAnnualKobo * 3);

      if (proposedAnnualKobo < lowerBound || proposedAnnualKobo > upperBound) {
        return {
          error: "That salary looks far outside the usual range for this role. Double-check the amount and try again.",
        };
      }
    }
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

function calculateMedian(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}
