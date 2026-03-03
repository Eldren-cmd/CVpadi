"use client";

import { saveCvDraftAction } from "@/app/build/actions";
import {
  createCertificationEntry,
  createDefaultCVFormData,
  createEducationEntry,
  createExperienceEntry,
  DEGREE_CLASS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  INDUSTRIES,
  NIGERIAN_CITIES,
  NIGERIAN_STATES,
  NYSC_STATUS_OPTIONS,
} from "@/lib/cv/constants";
import { computeCVScore } from "@/lib/cv/score";
import type { CVFormData, SyncStatus } from "@/lib/cv/types";
import { isAtLeast13, nigerianPhoneRegex } from "@/lib/cv/validation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { ScoreDial } from "./score-dial";
import { Field, inputClassName, RepeaterStep, StepLabel, SyncIndicator, TagStep } from "./wizard-ui";

const STEP_TITLES = [
  "Full name",
  "Phone",
  "Email",
  "Location state",
  "Location city",
  "Date of birth",
  "Industry",
  "Experience level",
  "NYSC status",
  "Career objective",
  "Education",
  "Work experience",
  "Skills",
  "Certifications",
  "Languages",
  "Referee 1",
  "Referee 2",
];

type Errors = Record<string, string>;

export function FormWizard({
  initialCvId,
  initialDraft,
  initialUpdatedAt,
  userId,
  userEmail,
}: {
  initialCvId: string;
  initialDraft: CVFormData;
  initialUpdatedAt: string;
  userId: string;
  userEmail: string;
}) {
  const [draft, setDraft] = useState<CVFormData>(initialDraft);
  const [cvId, setCvId] = useState(initialCvId);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [serverUpdatedAt, setServerUpdatedAt] = useState(
    new Date(initialUpdatedAt).getTime(),
  );
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [scoreResult, setScoreResult] = useState(() => computeCVScore(initialDraft));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = useMemo(() => `cvpadi_draft_${userId}`, [userId]);
  const progress = ((step + 1) / STEP_TITLES.length) * 100;

  useEffect(() => {
    const localDraft = localStorage.getItem(storageKey);
    if (!localDraft) return;

    try {
      const parsed = JSON.parse(localDraft) as CVFormData;
      if ((parsed.lastSavedAt ?? 0) > serverUpdatedAt) {
        setShowRestoreBanner(true);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [serverUpdatedAt, storageKey]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const saveDraft = (nextDraft: CVFormData) => {
    localStorage.setItem(storageKey, JSON.stringify(nextDraft));
    setSyncStatus("saving");
    setStatusMessage("");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await saveCvDraftAction({
            cvId,
            formData: nextDraft,
          });

          setCvId(result.id);
          setServerUpdatedAt(new Date(result.updatedAt).getTime());
          setScoreResult({ score: result.score, suggestions: result.suggestions });
          setSyncStatus("saved");
        } catch (error) {
          setSyncStatus("offline");
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Saved locally. Server sync failed.",
          );
        }
      });
    }, 350);
  };

  const handleFieldChange = <K extends keyof CVFormData>(
    field: K,
    value: CVFormData[K],
  ) => {
    const nextDraft = { ...draft, [field]: value };
    setDraft(nextDraft);
    setScoreResult(computeCVScore(nextDraft));
  };

  const handleNext = () => {
    const validationErrors = validateStep(step, draft);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const nextDraft = {
      ...draft,
      email: draft.email || userEmail,
      lastSavedAt: Date.now(),
    };

    setDraft(nextDraft);
    saveDraft(nextDraft);
    setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
  };

  const handleBack = () => {
    const nextDraft = {
      ...draft,
      lastSavedAt: Date.now(),
    };

    setDraft(nextDraft);
    saveDraft(nextDraft);
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleRestore = () => {
    const localDraft = localStorage.getItem(storageKey);
    if (!localDraft) return;

    const parsed = JSON.parse(localDraft) as CVFormData;
    const restored = {
      ...createDefaultCVFormData(userEmail),
      ...parsed,
    };

    setDraft(restored);
    setScoreResult(computeCVScore(restored));
    setShowRestoreBanner(false);
    setSyncStatus("offline");
  };

  const currentCities = NIGERIAN_CITIES[draft.locationState] ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-[var(--border-light)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
              Step {step + 1} of {STEP_TITLES.length}
            </p>
            <h1 className="mt-2 font-heading text-3xl text-foreground">
              {STEP_TITLES[step]}
            </h1>
          </div>
          <SyncIndicator syncStatus={syncStatus} />
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--border-light)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {showRestoreBanner ? (
          <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--gold-light)] px-4 py-3 text-sm leading-6 text-foreground">
            <p>We found unsaved progress. Restore the newer local draft?</p>
            <div className="mt-3 flex gap-3">
              <button className="font-medium text-[var(--accent)]" onClick={handleRestore} type="button">
                Restore it
              </button>
              <button
                className="font-medium text-[var(--ink-light)]"
                onClick={() => setShowRestoreBanner(false)}
                type="button"
              >
                Keep server copy
              </button>
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <p className="mt-5 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm text-[var(--ink-light)]">
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-6">{renderStep()}</div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={step === 0}
            onClick={handleBack}
            type="button"
          >
            Back
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
            onClick={handleNext}
            type="button"
          >
            {step === STEP_TITLES.length - 1 ? "Save draft" : "Next"}
          </button>
        </div>
      </section>

      <ScoreDial onJump={setStep} score={scoreResult.score} suggestions={scoreResult.suggestions} />
    </div>
  );

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <Field
            error={errors.fullName}
            label="Full name"
            renderInput={
              <input
                className={inputClassName}
                onChange={(event) => handleFieldChange("fullName", event.target.value)}
                placeholder="e.g. Adaeze Okafor"
                type="text"
                value={draft.fullName}
              />
            }
          />
        );
      case 1:
        return (
          <Field
            error={errors.phone}
            label="Phone"
            renderInput={
              <input
                className={inputClassName}
                onChange={(event) => handleFieldChange("phone", event.target.value)}
                placeholder="08012345678"
                type="tel"
                value={draft.phone}
              />
            }
          />
        );
      case 2:
        return (
          <Field
            error={errors.email}
            label="Email"
            renderInput={
              <input
                className={inputClassName}
                onChange={(event) => handleFieldChange("email", event.target.value)}
                placeholder="name@example.com"
                type="email"
                value={draft.email}
              />
            }
          />
        );
      case 3:
        return (
          <Field
            error={errors.locationState}
            label="Location state"
            renderInput={
              <select
                className={inputClassName}
                onChange={(event) => handleFieldChange("locationState", event.target.value)}
                value={draft.locationState}
              >
                <option value="">Select a state</option>
                {NIGERIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </select>
            }
          />
        );
      case 4:
        return (
          <Field
            error={errors.locationCity}
            label="Location city"
            renderInput={
              <>
                <input
                  className={inputClassName}
                  list="city-suggestions"
                  onChange={(event) => handleFieldChange("locationCity", event.target.value)}
                  placeholder="City"
                  type="text"
                  value={draft.locationCity}
                />
                <datalist id="city-suggestions">
                  {currentCities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </>
            }
          />
        );
      case 5:
        return (
          <Field
            error={errors.dateOfBirth}
            label="Date of birth"
            renderInput={
              <input
                className={inputClassName}
                onChange={(event) => handleFieldChange("dateOfBirth", event.target.value)}
                type="date"
                value={draft.dateOfBirth}
              />
            }
          />
        );
      case 6:
        return (
          <Field
            error={errors.industry}
            label="Industry"
            renderInput={
              <select
                className={inputClassName}
                onChange={(event) => handleFieldChange("industry", event.target.value)}
                value={draft.industry}
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            }
          />
        );
      case 7:
        return renderSimpleSelect(
          "Experience level",
          "experienceLevel",
          EXPERIENCE_LEVEL_OPTIONS,
          errors.experienceLevel,
        );
      case 8:
        return renderSimpleSelect("NYSC status", "nyscStatus", NYSC_STATUS_OPTIONS, errors.nyscStatus);
      case 9:
        return (
          <Field
            error={errors.careerObjective}
            label="Career objective"
            renderInput={
              <textarea
                className={`${inputClassName} min-h-40 py-3`}
                onChange={(event) => handleFieldChange("careerObjective", event.target.value)}
                placeholder="Write a concise objective tailored to the roles you want."
                value={draft.careerObjective}
              />
            }
          />
        );
      case 10:
        return renderEducationStep();
      case 11:
        return renderExperienceStep();
      case 12:
        return (
          <TagStep
            error={errors.skills}
            label="Skills"
            onChange={(value) => handleFieldChange("skills", value)}
            placeholder="Add a skill and press Enter"
            tags={draft.skills}
          />
        );
      case 13:
        return renderCertificationStep();
      case 14:
        return (
          <TagStep
            error={errors.languages}
            label="Languages"
            onChange={(value) => handleFieldChange("languages", value)}
            placeholder="English, Yoruba, Hausa..."
            tags={draft.languages}
          />
        );
      case 15:
        return renderRefereeStep("refereeOne", "Referee 1", errors.refereeOne);
      case 16:
        return renderRefereeStep("refereeTwo", "Referee 2", errors.refereeTwo);
      default:
        return null;
    }
  }

  function renderSimpleSelect(
    label: string,
    field: "experienceLevel" | "nyscStatus",
    options: readonly { value: string; label: string }[],
    error?: string,
  ) {
    return (
      <Field
        error={error}
        label={label}
        renderInput={
          <select
            className={inputClassName}
            onChange={(event) =>
              handleFieldChange(field, event.target.value as CVFormData[typeof field])
            }
            value={draft[field]}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />
    );
  }

  function renderEducationStep() {
    return (
      <RepeaterStep
        addLabel="Add another education entry"
        description="Institution, course, degree class, and year."
        error={errors.education}
        items={draft.education.map((entry, index) => (
          <div className="grid gap-3 sm:grid-cols-2" key={entry.id}>
            <input className={inputClassName} onChange={(event) => updateArrayItem("education", index, "institution", event.target.value)} placeholder="Institution" type="text" value={entry.institution} />
            <input className={inputClassName} onChange={(event) => updateArrayItem("education", index, "course", event.target.value)} placeholder="Course" type="text" value={entry.course} />
            <select className={inputClassName} onChange={(event) => updateArrayItem("education", index, "degreeClass", event.target.value)} value={entry.degreeClass}>
              {DEGREE_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input className={inputClassName} onChange={(event) => updateArrayItem("education", index, "year", event.target.value)} placeholder="Graduation year" type="text" value={entry.year} />
          </div>
        ))}
        label="Education"
        onAdd={() => handleFieldChange("education", [...draft.education, createEducationEntry()])}
      />
    );
  }

  function renderExperienceStep() {
    return (
      <div className="grid gap-4">
        <label className="flex items-center gap-3 text-sm">
          <input checked={draft.noExperienceYet} onChange={(event) => handleFieldChange("noExperienceYet", event.target.checked)} type="checkbox" />
          No experience yet
        </label>
        {!draft.noExperienceYet ? (
          <RepeaterStep
            addLabel="Add another experience entry"
            description="Company, role, dates, and responsibilities."
            error={errors.workExperience}
            items={draft.workExperience.map((entry, index) => (
              <div className="grid gap-3 sm:grid-cols-2" key={entry.id}>
                <input className={inputClassName} onChange={(event) => updateArrayItem("workExperience", index, "company", event.target.value)} placeholder="Company" type="text" value={entry.company} />
                <input className={inputClassName} onChange={(event) => updateArrayItem("workExperience", index, "role", event.target.value)} placeholder="Role" type="text" value={entry.role} />
                <input className={inputClassName} onChange={(event) => updateArrayItem("workExperience", index, "startDate", event.target.value)} type="month" value={entry.startDate} />
                <input className={inputClassName} onChange={(event) => updateArrayItem("workExperience", index, "endDate", event.target.value)} type="month" value={entry.endDate} />
                <textarea className={`${inputClassName} min-h-32 py-3 sm:col-span-2`} onChange={(event) => updateArrayItem("workExperience", index, "responsibilities", event.target.value)} placeholder="Summarise what you achieved." value={entry.responsibilities} />
              </div>
            ))}
            label="Work experience"
            onAdd={() => handleFieldChange("workExperience", [...draft.workExperience, createExperienceEntry()])}
          />
        ) : null}
      </div>
    );
  }

  function renderCertificationStep() {
    return (
      <RepeaterStep
        addLabel="Add another certification"
        description="Optional, but useful for Nigerian employers."
        error={errors.certifications}
        items={draft.certifications.map((entry, index) => (
          <div className="grid gap-3 sm:grid-cols-3" key={entry.id}>
            <input className={inputClassName} onChange={(event) => updateArrayItem("certifications", index, "name", event.target.value)} placeholder="Certification" type="text" value={entry.name} />
            <input className={inputClassName} onChange={(event) => updateArrayItem("certifications", index, "issuer", event.target.value)} placeholder="Issuer" type="text" value={entry.issuer} />
            <input className={inputClassName} onChange={(event) => updateArrayItem("certifications", index, "year", event.target.value)} placeholder="Year" type="text" value={entry.year} />
          </div>
        ))}
        label="Certifications"
        onAdd={() => handleFieldChange("certifications", [...draft.certifications, createCertificationEntry()])}
      />
    );
  }

  function renderRefereeStep(field: "refereeOne" | "refereeTwo", label: string, error?: string) {
    const referee = draft[field];

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <StepLabel error={error} label={label} />
        </div>
        <input className={inputClassName} onChange={(event) => updateReferee(field, "name", event.target.value)} placeholder="Name" type="text" value={referee.name} />
        <input className={inputClassName} onChange={(event) => updateReferee(field, "title", event.target.value)} placeholder="Title" type="text" value={referee.title} />
        <input className={inputClassName} onChange={(event) => updateReferee(field, "company", event.target.value)} placeholder="Company" type="text" value={referee.company} />
        <input className={inputClassName} onChange={(event) => updateReferee(field, "phone", event.target.value)} placeholder="Phone" type="tel" value={referee.phone} />
        <input className={`${inputClassName} sm:col-span-2`} onChange={(event) => updateReferee(field, "email", event.target.value)} placeholder="Email" type="email" value={referee.email} />
      </div>
    );
  }

  function updateReferee(
    field: "refereeOne" | "refereeTwo",
    key: keyof CVFormData["refereeOne"],
    value: string,
  ) {
    handleFieldChange(field, {
      ...draft[field],
      [key]: value,
    });
  }

  function updateArrayItem(
    field: "education" | "workExperience" | "certifications",
    index: number,
    key: string,
    value: string,
  ) {
    const nextItems = [...draft[field]];
    nextItems[index] = {
      ...nextItems[index],
      [key]: value,
    };

    handleFieldChange(field, nextItems as CVFormData[typeof field]);
  }
}

function validateStep(step: number, draft: CVFormData): Errors {
  switch (step) {
    case 0:
      return draft.fullName.trim().length >= 2 ? {} : { fullName: "Enter your full name." };
    case 1:
      return nigerianPhoneRegex.test(draft.phone.trim())
        ? {}
        : { phone: "Use a valid Nigerian number starting with 07, 08, 09, or +234." };
    case 2:
      return /\S+@\S+\.\S+/.test(draft.email) ? {} : { email: "Enter a valid email address." };
    case 3:
      return draft.locationState ? {} : { locationState: "Select your location state." };
    case 4:
      return draft.locationCity.trim() ? {} : { locationCity: "Enter your city." };
    case 5:
      return isAtLeast13(draft.dateOfBirth)
        ? {}
        : { dateOfBirth: "The user must be at least 13 years old." };
    case 6:
      return draft.industry ? {} : { industry: "Select an industry." };
    case 9:
      return draft.careerObjective.trim().length >= 40
        ? {}
        : { careerObjective: "Write at least 40 characters." };
    case 10:
      return draft.education.some((entry) => entry.institution.trim() && entry.course.trim() && entry.year.trim())
        ? {}
        : { education: "Add at least one complete education entry." };
    case 11:
      return draft.noExperienceYet || draft.workExperience.some((entry) => entry.company.trim() && entry.role.trim() && entry.responsibilities.trim().length >= 20)
        ? {}
        : { workExperience: "Add work experience or mark no experience yet." };
    case 12:
      return draft.skills.length >= 5 ? {} : { skills: "Add at least five skills." };
    case 14:
      return draft.languages.length >= 1 ? {} : { languages: "Add at least one language." };
    case 15:
      return refereeComplete(draft.refereeOne) ? {} : { refereeOne: "Complete all fields for referee 1." };
    case 16:
      return refereeComplete(draft.refereeTwo) ? {} : { refereeTwo: "Complete all fields for referee 2." };
    default:
      return {};
  }
}

function refereeComplete(referee: CVFormData["refereeOne"]) {
  return Boolean(
    referee.name.trim() &&
      referee.title.trim() &&
      referee.company.trim() &&
      referee.phone.trim() &&
      referee.email.trim(),
  );
}
