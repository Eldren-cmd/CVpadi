import type { CVFormData, CVSuggestion } from "./types";

export function computeCVScore(formData: CVFormData) {
  let score = 0;
  const suggestions: CVSuggestion[] = [];

  if (formData.fullName.trim().length >= 2) score += 8;
  else suggestions.push({ id: "full-name", message: "Add your full name.", step: 0 });

  if (formData.phone.trim()) score += 6;
  else suggestions.push({ id: "phone", message: "Add a Nigerian phone number.", step: 1 });

  if (formData.email.trim()) score += 6;
  else suggestions.push({ id: "email", message: "Add the email recruiters can reach.", step: 2 });

  if (formData.locationState.trim()) score += 5;
  else suggestions.push({ id: "state", message: "Select your current state.", step: 3 });

  if (formData.locationCity.trim()) score += 5;
  else suggestions.push({ id: "city", message: "Specify your current city.", step: 4 });

  if (formData.dateOfBirth.trim()) score += 5;
  else suggestions.push({ id: "dob", message: "Add your date of birth.", step: 5 });

  if (formData.industry.trim()) score += 5;
  else suggestions.push({ id: "industry", message: "Choose a target industry.", step: 6 });

  if (formData.experienceLevel.trim()) score += 5;
  if (formData.nyscStatus.trim()) score += 5;

  if (formData.careerObjective.trim().length >= 40) score += 10;
  else {
    suggestions.push({
      id: "objective",
      message: "Write a clearer career objective of at least 40 characters.",
      step: 9,
    });
  }

  const hasEducation = formData.education.some(
    (entry) => entry.institution.trim() && entry.course.trim() && entry.year.trim(),
  );
  if (hasEducation) score += 12;
  else suggestions.push({ id: "education", message: "Add at least one education entry.", step: 10 });

  const hasExperience =
    formData.noExperienceYet ||
    formData.workExperience.some(
      (entry) =>
        entry.company.trim() &&
        entry.role.trim() &&
        (entry.responsibilities.trim().length >= 20 || entry.startDate.trim()),
    );

  if (hasExperience) score += 12;
  else {
    suggestions.push({
      id: "experience",
      message: "Add work experience or mark that you have no experience yet.",
      step: 11,
    });
  }

  if (formData.skills.length >= 5) score += 8;
  else suggestions.push({ id: "skills", message: "Add at least five core skills.", step: 12 });

  if (formData.certifications.some((entry) => entry.name.trim())) score += 4;
  else suggestions.push({ id: "certifications", message: "Add a certification or leave a stronger skill set.", step: 13 });

  if (formData.languages.length >= 1) score += 4;
  else suggestions.push({ id: "languages", message: "Add the languages you speak.", step: 14 });

  const refereeOneReady = isRefereeComplete(formData.refereeOne);
  const refereeTwoReady = isRefereeComplete(formData.refereeTwo);

  if (refereeOneReady) score += 5;
  else suggestions.push({ id: "referee-one", message: "Complete referee 1.", step: 15 });

  if (refereeTwoReady) score += 5;
  else suggestions.push({ id: "referee-two", message: "Complete referee 2.", step: 16 });

  return {
    score: Math.min(score, 100),
    suggestions,
  };
}

function isRefereeComplete(referee: CVFormData["refereeOne"]) {
  return Boolean(
    referee.name.trim() &&
      referee.title.trim() &&
      referee.company.trim() &&
      referee.phone.trim() &&
      referee.email.trim(),
  );
}
