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
import Script from "next/script";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { PaymentPanel } from "./payment-panel";
import { PreviewPanel } from "./preview-panel";
import { ScoreDial } from "./score-dial";
import {
  Field,
  inputClassName,
  RepeaterStep,
  selectChevronStyle,
  selectClassName,
  StepLabel,
  SyncIndicator,
  TagStep,
} from "./wizard-ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export function FormWizard({
  initialCvId,
  initialAccountCreditKobo,
  initialDraft,
  initialFreePreviewsUsed,
  initialPaymentReference,
  initialReferralCode,
  initialUpdatedAt,
  isPaid,
  userId,
  userEmail,
}: {
  initialCvId: string;
  initialAccountCreditKobo: number;
  initialDraft: CVFormData;
  initialFreePreviewsUsed: number;
  initialPaymentReference?: string | null;
  initialReferralCode: string;
  initialUpdatedAt: string;
  isPaid: boolean;
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
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [scoreResult, setScoreResult] = useState(() => computeCVScore(initialDraft));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = useMemo(() => `cvpadi_draft_${userId}`, [userId]);
  const progress = ((step + 1) / STEP_TITLES.length) * 100;
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [shakeStep, setShakeStep] = useState(false);
  const [progressFlash, setProgressFlash] = useState(false);

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

  useEffect(() => {
    let isCancelled = false;

    async function loadFingerprint() {
      try {
        const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
        const agent = await FingerprintJS.load();
        const result = await agent.get();

        if (!isCancelled) {
          setDeviceFingerprint(result.visitorId);
        }
      } catch {
        // Fingerprinting is a soft signal; the flow still works if it fails.
      }
    }

    void loadFingerprint();

    return () => {
      isCancelled = true;
    };
  }, []);

  const saveDraft = (
    nextDraft: CVFormData,
    options?: {
      recaptchaToken?: string | null;
      requireRecaptcha?: boolean;
    },
  ) => {
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
            deviceFingerprint,
            formData: nextDraft,
            honeypot,
            recaptchaToken: options?.recaptchaToken,
            requireRecaptcha: options?.requireRecaptcha,
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

  const handleNext = async () => {
    const validationErrors = validateStep(step, draft);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setShakeStep(true);
      window.setTimeout(() => setShakeStep(false), 320);
      return;
    }

    if (honeypot.trim()) {
      setStatusMessage("Unable to continue right now.");
      return;
    }

    let recaptchaToken: string | null = null;
    if (step === 0) {
      recaptchaToken = await getRecaptchaToken({
        action: "build_step_one",
        siteKey: recaptchaSiteKey,
      });

      if (recaptchaSiteKey && !recaptchaToken) {
        setStatusMessage("Security check not ready yet. Refresh and try again.");
        return;
      }
    }

    const nextDraft = {
      ...draft,
      email: draft.email || userEmail,
      furthestStepIndex: Math.max(
        draft.furthestStepIndex ?? 0,
        Math.min(step + 1, STEP_TITLES.length - 1),
      ),
      lastSavedAt: Date.now(),
    };

    setDraft(nextDraft);
    saveDraft(nextDraft, {
      recaptchaToken,
      requireRecaptcha: step === 0,
    });
    setProgressFlash(true);
    window.setTimeout(() => setProgressFlash(false), 280);
    setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
  };

  const handleBack = () => {
    const nextDraft = {
      ...draft,
      furthestStepIndex: draft.furthestStepIndex ?? step,
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
    <div className="relative pb-12">
      {recaptchaSiteKey ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="afterInteractive"
        />
      ) : null}

      <header className="fixed inset-x-0 top-0 z-30 border-b border-[var(--border)] bg-[var(--off-black)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <p className="font-display text-xl tracking-[-0.02em] text-[var(--cream)]">
            CV<span className="text-[var(--green)]">Padi</span>
          </p>

          <div className="flex-1">
            <div className="h-[5px] overflow-hidden rounded-full bg-[var(--faint)]">
              <div
                className={`h-full rounded-full bg-[var(--green)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${progressFlash ? "shadow-[0_0_18px_var(--green)]" : ""}`.trim()}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cream-dim)] sm:inline-flex">
              Step {step + 1} of {STEP_TITLES.length}
            </span>
            <SyncIndicator syncStatus={syncStatus} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-28 sm:px-6">
        <section className="mx-auto w-full max-w-[560px] rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div aria-hidden="true" className="sr-only">
            <label htmlFor="company-website">Leave this field empty</label>
            <input
              autoComplete="off"
              id="company-website"
              name="company-website"
              onChange={(event) => setHoneypot(event.target.value)}
              tabIndex={-1}
              type="text"
              value={honeypot}
            />
          </div>

          {step > 0 ? (
            <button
              className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)]"
              onClick={handleBack}
              type="button"
            >
              Back
            </button>
          ) : null}

          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--green)]">
            Step {step + 1} of {STEP_TITLES.length} - {STEP_TITLES[step].toUpperCase()}
          </p>
          <h1 className="mt-3 font-heading text-[32px] leading-[1.1] text-[var(--cream)]">
            {STEP_TITLES[step]}
          </h1>

          {showRestoreBanner ? (
            <div className="mt-5 rounded-[10px] border border-[var(--gold)] bg-[var(--gold-glow)] px-4 py-3 text-sm leading-6 text-[var(--cream)]">
              <p>We found newer local progress. Restore it?</p>
              <div className="mt-2 flex gap-3">
                <button
                  className="font-display text-sm text-[var(--gold)]"
                  onClick={handleRestore}
                  type="button"
                >
                  Restore
                </button>
                <button
                  className="font-display text-sm text-[var(--cream-dim)]"
                  onClick={() => setShowRestoreBanner(false)}
                  type="button"
                >
                  Keep server copy
                </button>
              </div>
            </div>
          ) : null}

          {statusMessage ? (
            <p className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--cream-dim)]">
              {statusMessage}
            </p>
          ) : null}

          <div className={`mt-6 ${shakeStep ? "[animation:shake_0.3s_ease]" : ""}`.trim()}>
            <div className="step-in" key={step}>
              {renderStep()}
            </div>
          </div>

          <button
            className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[var(--green)] px-5 font-display text-base text-[var(--black)] transition-all duration-200 hover:translate-y-[-2px] hover:bg-[#33EE8A] hover:shadow-[0_18px_42px_var(--green-glow)]"
            onClick={handleNext}
            type="button"
          >
            {step === STEP_TITLES.length - 1 ? "Save draft" : "Continue"}
          </button>
        </section>

        <div className="mx-auto grid w-full max-w-4xl gap-6">
          <ScoreDial onJump={setStep} score={scoreResult.score} suggestions={scoreResult.suggestions} />
          <PreviewPanel
            accountCreditKobo={initialAccountCreditKobo}
            cvId={cvId}
            deviceFingerprint={deviceFingerprint}
            draft={draft}
            honeypot={honeypot}
            initialFreePreviewsUsed={initialFreePreviewsUsed}
            isComplete={scoreResult.suggestions.length === 0}
            isPaid={isPaid}
            referralCode={initialReferralCode}
            score={scoreResult.score}
          />
          <PaymentPanel
            availableCreditKobo={initialAccountCreditKobo}
            cvId={cvId}
            initialPaymentReference={initialPaymentReference}
            isPaid={isPaid}
          />
        </div>
      </div>
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
                className={selectClassName}
                onChange={(event) => handleFieldChange("locationState", event.target.value)}
                style={selectChevronStyle}
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
                className={selectClassName}
                onChange={(event) => handleFieldChange("industry", event.target.value)}
                style={selectChevronStyle}
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
      <div className="grid gap-3">
        <StepLabel error={error} label={label} />
        <div className="grid gap-2">
          {options.map((option) => {
            const selected = draft[field] === option.value;

            return (
              <button
                className={`flex min-h-[52px] items-center justify-between rounded-[10px] border px-4 text-left text-sm transition-all duration-200 ${selected ? "border-[var(--green)] bg-[var(--green-glow)] text-[var(--green)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--cream-dim)] hover:border-[var(--border-mid)] hover:bg-[var(--card)]"}`.trim()}
                key={option.value}
                onClick={() => handleFieldChange(field, option.value as CVFormData[typeof field])}
                type="button"
              >
                <span className="font-body">{option.label}</span>
                {selected ? <span className="text-xs">✓</span> : null}
              </button>
            );
          })}
        </div>
      </div>
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
            <select
              className={selectClassName}
              onChange={(event) => updateArrayItem("education", index, "degreeClass", event.target.value)}
              style={selectChevronStyle}
              value={entry.degreeClass}
            >
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
        <label className="inline-flex min-h-12 items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--cream-dim)]">
          <input
            checked={draft.noExperienceYet}
            className="h-4 w-4 rounded border-[var(--border-mid)] bg-[var(--off-black)] text-[var(--green)]"
            onChange={(event) => handleFieldChange("noExperienceYet", event.target.checked)}
            type="checkbox"
          />
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

async function getRecaptchaToken({
  action,
  siteKey,
}: {
  action: string;
  siteKey?: string;
}) {
  if (!siteKey) {
    return null;
  }

  if (!window.grecaptcha) {
    return null;
  }

  return new Promise<string | null>((resolve) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(siteKey, { action })
        .then(resolve)
        .catch(() => resolve(null));
    });
  });
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
      return countWords(draft.careerObjective) >= 30
        ? {}
        : { careerObjective: "Write at least 30 words for a stronger objective." };
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

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
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

