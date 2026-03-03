export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
export type NyscStatus = "discharged" | "exempted" | "ongoing" | "not_yet";
export type DegreeClass =
  | "first_class"
  | "second_class_upper"
  | "second_class_lower"
  | "third_class"
  | "pass"
  | "distinction"
  | "merit"
  | "credit"
  | "other";

export type SyncStatus = "saved" | "saving" | "offline";

export interface EducationEntry {
  id: string;
  institution: string;
  course: string;
  degreeClass: DegreeClass;
  year: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface RefereeEntry {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
}

export interface CVFormData {
  fullName: string;
  phone: string;
  email: string;
  locationState: string;
  locationCity: string;
  dateOfBirth: string;
  industry: string;
  experienceLevel: ExperienceLevel;
  nyscStatus: NyscStatus;
  careerObjective: string;
  education: EducationEntry[];
  workExperience: ExperienceEntry[];
  noExperienceYet: boolean;
  skills: string[];
  certifications: CertificationEntry[];
  languages: string[];
  refereeOne: RefereeEntry;
  refereeTwo: RefereeEntry;
  furthestStepIndex: number;
  lastSavedAt: number | null;
}

export interface DraftSaveResult {
  id: string;
  updatedAt: string;
  score: number;
  suggestions: CVSuggestion[];
}

export interface CVSuggestion {
  id: string;
  message: string;
  step: number;
}
