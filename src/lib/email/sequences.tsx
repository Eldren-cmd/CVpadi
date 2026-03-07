import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { getSignedCvAssetLinks } from "@/lib/delivery/cv-assets";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReactElement } from "react";
import { extractEmailPreferences } from "./preferences";
import {
  AbandonmentSequenceEmail,
  AiEnhancedCvReadyEmail,
  CvReadyEmail,
  JobsDailyDigestEmail,
  JobsDigestScaffoldEmail,
  PostDownloadReminderEmail,
  ResumeSavedEmail,
} from "./templates";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  return new Resend(apiKey);
}

type SequenceType = "abandonment" | "post_payment";

interface EmailSequenceRow {
  id: string;
  scheduled_for: string | null;
  sent_at: string | null;
  step_number: number;
  sequence_type: SequenceType;
  user_id: string;
}

interface SequenceContext {
  email: string;
  fullName: string;
  industry: string;
  isPaid: boolean;
  latestCvId: string | null;
  latestPaidCvId: string | null;
  preferences: ReturnType<typeof extractEmailPreferences>;
}

export async function scheduleBuildEmailSequences({
  email,
  fullName,
  furthestStepIndex,
  userId,
}: {
  email: string;
  fullName: string;
  furthestStepIndex: number;
  userId: string;
}) {
  const supabase = createAdminClient();

  if (furthestStepIndex >= 3) {
    const welcomeSequence = await getOrCollapseSequence({
      sequenceType: "abandonment",
      stepNumber: 1,
      supabase,
      userId,
    });

    if (!welcomeSequence) {
      let sent = false;

      try {
        sent = await sendResumeSavedSequenceEmail({ email, fullName });
      } catch (error) {
        captureSequenceError(error, {
          sequenceType: "abandonment",
          stepNumber: 1,
          userId,
        });
      }

      await createSequenceRow({
        scheduledFor: new Date().toISOString(),
        sentAt: sent ? new Date().toISOString() : null,
        sequenceType: "abandonment",
        stepNumber: 1,
        supabase,
        userId,
      });
    }
  }

  if (furthestStepIndex >= 5) {
    await scheduleSequence({
      delayMs: 60 * 60 * 1000,
      sequenceType: "abandonment",
      stepNumber: 2,
      supabase,
      userId,
    });
    await scheduleSequence({
      delayMs: 24 * 60 * 60 * 1000,
      sequenceType: "abandonment",
      stepNumber: 3,
      supabase,
      userId,
    });
    await scheduleSequence({
      delayMs: 48 * 60 * 60 * 1000,
      sequenceType: "abandonment",
      stepNumber: 4,
      supabase,
      userId,
    });
  }
}

export async function schedulePostPaymentEmailSequences({
  email,
  fullName,
  jpgUrl,
  pdfUrl,
  sendImmediate,
  userId,
}: {
  email: string;
  fullName: string;
  jpgUrl: string;
  pdfUrl: string;
  sendImmediate: boolean;
  userId: string;
}) {
  const supabase = createAdminClient();

  await deletePendingSequences({
    sequenceType: "abandonment",
    stepNumbers: [2, 3, 4],
    supabase,
    userId,
  });

  const existingImmediate = await getOrCollapseSequence({
    sequenceType: "post_payment",
    stepNumber: 1,
    supabase,
    userId,
  });

  if (!existingImmediate) {
    let sent = false;

    if (sendImmediate) {
      try {
        sent = await sendCvReadySequenceEmail({
          email,
          fullName,
          jpgUrl,
          pdfUrl,
        });
      } catch (error) {
        captureSequenceError(error, {
          sequenceType: "post_payment",
          stepNumber: 1,
          userId,
        });
      }
    }

    await createSequenceRow({
      scheduledFor: new Date().toISOString(),
      sentAt: sent ? new Date().toISOString() : null,
      sequenceType: "post_payment",
      stepNumber: 1,
      supabase,
      userId,
    });
  }

  await scheduleSequence({
    delayMs: 3 * 24 * 60 * 60 * 1000,
    sequenceType: "post_payment",
    stepNumber: 2,
    supabase,
    userId,
  });
  await scheduleSequence({
    delayMs: 7 * 24 * 60 * 60 * 1000,
    sequenceType: "post_payment",
    stepNumber: 3,
    supabase,
    userId,
  });
}

export async function processDueEmailSequences(limit = 25) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const summary = {
    failed: 0,
    sent: 0,
    skipped: 0,
  };

  const { data: rows, error } = await supabase
    .from("email_sequences")
    .select("id, sequence_type, step_number, user_id, scheduled_for, sent_at")
    .is("sent_at", null)
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (rows ?? []) as EmailSequenceRow[]) {
    try {
      const context = await loadSequenceContext(row.user_id);

      if (!context.email) {
        await markSequenceSent(row.id);
        summary.skipped += 1;
        continue;
      }

      if (shouldSkipSequence(context, row)) {
        await markSequenceSent(row.id);
        summary.skipped += 1;
        continue;
      }

      if (row.sequence_type === "abandonment") {
        await sendAbandonmentStep(context, row.step_number);
      } else {
        await sendPostPaymentStep(context, row.step_number, row.user_id);
      }

      await markSequenceSent(row.id);
      summary.sent += 1;
    } catch (sequenceError) {
      summary.failed += 1;
      Sentry.withScope((scope) => {
        scope.setTag("email_sequence_id", row.id);
        scope.setTag("sequence_type", row.sequence_type);
        scope.setTag("sequence_step", String(row.step_number));
        scope.setTag("user_id", row.user_id);
        Sentry.captureException(sequenceError);
      });
    }
  }

  return summary;
}

async function loadSequenceContext(userId: string): Promise<SequenceContext> {
  const supabase = createAdminClient();
  const [
    { data: profile, error: profileError },
    authUserResult,
    { data: latestCv, error: cvError },
    { data: latestPaidPayment, error: paymentError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name, industry")
      .eq("id", userId)
      .single(),
    supabase.auth.admin.getUserById(userId),
    supabase
      .from("cvs")
      .select("id, form_data, is_paid")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("cv_id")
      .eq("user_id", userId)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Profile not found for email sequence.");
  }

  if (cvError) {
    throw new Error(cvError.message);
  }

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return {
    email: profile.email,
    fullName: profile.full_name ?? "",
    industry: profile.industry ?? "",
    isPaid: Boolean(latestCv?.is_paid),
    latestCvId: latestCv?.id ?? null,
    latestPaidCvId: latestPaidPayment?.cv_id ?? null,
    preferences: extractEmailPreferences(authUserResult.data.user?.user_metadata),
  };
}

function shouldSkipSequence(context: SequenceContext, row: EmailSequenceRow) {
  if (row.sequence_type === "post_payment" && row.step_number === 1) {
    return !context.latestPaidCvId;
  }

  if (context.preferences.unsubscribeAll) {
    return true;
  }

  if (context.preferences.frequency === "jobs_only") {
    return row.sequence_type !== "post_payment" || row.step_number !== 3;
  }

  if (context.preferences.frequency === "less_often") {
    return (
      (row.sequence_type === "abandonment" && row.step_number !== 3)
      || (row.sequence_type === "post_payment" && row.step_number === 3)
    );
  }

  if (row.sequence_type === "abandonment" && context.isPaid) {
    return true;
  }

  return false;
}

async function sendAbandonmentStep(context: SequenceContext, stepNumber: number) {
  const resumeUrl = await getResumeLink(context.email);

  switch (stepNumber) {
    case 1:
      await sendResumeSavedSequenceEmail({
        email: context.email,
        fullName: context.fullName,
        resumeUrl,
      });
      return;
    case 2:
      await sendEmail({
        email: context.email,
        react: (
          <AbandonmentSequenceEmail
            adviceBody="CVPadi already has the structure. You only need to finish a few fields and generate the preview."
            adviceTitle="Your draft is safe."
            ctaHref={resumeUrl}
            ctaLabel="Pick up where you left off"
            intro="Your CV draft is still there. When your connection settles, jump back in and finish the next few steps."
          />
        ),
        subject: "Your CV is saved - pick up where you left off",
      });
      return;
    case 3:
      await sendEmail({
        email: context.email,
        react: (
          <AbandonmentSequenceEmail
            adviceBody="A complete CV gives recruiters context: your NYSC status, your referees, and the skills that prove fit."
            adviceTitle="Complete CVs get more interview calls."
            ctaHref={resumeUrl}
            ctaLabel="Continue your CV"
            intro="Your draft is halfway there. Finishing the remaining steps makes a real difference when Nigerian recruiters screen quickly."
          />
        ),
        subject: "People with complete CVs get 3x more interview calls",
      });
      return;
    case 4:
      await sendEmail({
        email: context.email,
        react: (
          <AbandonmentSequenceEmail
            adviceBody="Two referees should include name, title, company, phone, and email. In Nigerian CVs, incomplete referee details make the document feel unfinished."
            adviceTitle="Referees are the section most people skip."
            ctaHref={resumeUrl}
            ctaLabel="Finish your draft"
            intro="One section changes how polished your CV feels immediately: properly formatted referee details."
          />
        ),
        subject: "The one section most people skip on their Nigerian CV",
      });
      return;
    default:
      return;
  }
}

async function sendPostPaymentStep(
  context: SequenceContext,
  stepNumber: number,
  userId: string,
) {
  if (!context.latestPaidCvId) {
    return;
  }

  if (stepNumber === 1) {
    const links = await getSignedCvAssetLinks({
      cvId: context.latestPaidCvId,
      userId,
    });

    await sendCvReadySequenceEmail({
      email: context.email,
      fullName: context.fullName,
      jpgUrl: links.jpgUrl,
      pdfUrl: links.pdfUrl,
    });
    return;
  }

  if (stepNumber === 2) {
    await sendEmail({
      email: context.email,
      react: (
        <PostDownloadReminderEmail
          buildUrl={`${appUrl}/build`}
          fullName={context.fullName}
        />
      ),
      subject: "Need to update anything? Edits are free, re-download is N500",
    });
    return;
  }

  if (stepNumber === 3) {
    await sendEmail({
      email: context.email,
      react: (
        <JobsDigestScaffoldEmail
          buildUrl={`${appUrl}/build`}
          industry={context.industry}
        />
      ),
      subject: "3 jobs matching your profile this week",
    });
  }
}

async function sendResumeSavedSequenceEmail({
  email,
  fullName,
  resumeUrl,
}: {
  email: string;
  fullName: string;
  resumeUrl?: string;
}) {
  const nextResumeUrl = resumeUrl ?? await getResumeLink(email);

  return sendEmail({
    email,
    react: (
      <ResumeSavedEmail
        fullName={fullName}
        resumeUrl={nextResumeUrl}
      />
    ),
    subject: "Confirm your email - your CV is being saved",
  });
}

async function sendCvReadySequenceEmail({
  email,
  fullName,
  jpgUrl,
  pdfUrl,
}: {
  email: string;
  fullName: string;
  jpgUrl: string;
  pdfUrl: string;
}) {
  return sendEmail({
    email,
    react: (
      <CvReadyEmail
        fullName={fullName}
        jpgUrl={jpgUrl}
        pdfUrl={pdfUrl}
      />
    ),
    subject: "Your CV is ready - PDF and WhatsApp image included",
  });
}

export async function sendAiEnhancedCvEmail({
  email,
  fullName,
  jpgUrl,
  pdfUrl,
}: {
  email: string;
  fullName: string;
  jpgUrl: string;
  pdfUrl: string;
}) {
  return sendEmail({
    email,
    react: (
      <AiEnhancedCvReadyEmail
        fullName={fullName}
        jpgUrl={jpgUrl}
        pdfUrl={pdfUrl}
      />
    ),
    subject: "Your AI-enhanced CV is ready",
  });
}

export async function sendJobsDigestEmail({
  buildUrl,
  email,
  fullName,
  jobs,
}: {
  buildUrl: string;
  email: string;
  fullName: string;
  jobs: Array<{
    company: string;
    locationLabel: string;
    matchScore: number;
    salaryLabel: string;
    sourceUrl: string | null;
    title: string;
  }>;
}) {
  return sendEmail({
    email,
    react: (
      <JobsDailyDigestEmail
        buildUrl={buildUrl}
        fullName={fullName}
        jobs={jobs}
      />
    ),
    subject: "Your top 3 CVPadi job matches for today",
  });
}

async function sendEmail({
  email,
  react,
  subject,
}: {
  email: string;
  react: ReactElement;
  subject: string;
}) {
  const resend = getResendClient();

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "CVPadi <onboarding@resend.dev>",
    react,
    subject,
    to: email,
  });

  return true;
}

async function getResumeLink(email: string) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      email,
      options: {
        redirectTo: `${appUrl}/build`,
      },
      type: "magiclink",
    });

    if (!error && data.properties.action_link) {
      return data.properties.action_link;
    }
  } catch {
    // Fall back to the login page when admin magic links are unavailable.
  }

  return `${appUrl}/login?next=/build`;
}

async function scheduleSequence({
  delayMs,
  sequenceType,
  stepNumber,
  supabase,
  userId,
}: {
  delayMs: number;
  sequenceType: SequenceType;
  stepNumber: number;
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  const existing = await getOrCollapseSequence({
    sequenceType,
    stepNumber,
    supabase,
    userId,
  });

  if (!existing) {
    await createSequenceRow({
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
      sentAt: null,
      sequenceType,
      stepNumber,
      supabase,
      userId,
    });
    return;
  }

  if (existing.sent_at) {
    return;
  }

  await supabase
    .from("email_sequences")
    .update({
      scheduled_for: new Date(Date.now() + delayMs).toISOString(),
    })
    .eq("id", existing.id);
}

async function createSequenceRow({
  scheduledFor,
  sentAt,
  sequenceType,
  stepNumber,
  supabase,
  userId,
}: {
  scheduledFor: string;
  sentAt: string | null;
  sequenceType: SequenceType;
  stepNumber: number;
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  const { error } = await supabase.from("email_sequences").insert({
    scheduled_for: scheduledFor,
    sent_at: sentAt,
    sequence_type: sequenceType,
    step_number: stepNumber,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function getOrCollapseSequence({
  sequenceType,
  stepNumber,
  supabase,
  userId,
}: {
  sequenceType: SequenceType;
  stepNumber: number;
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("email_sequences")
    .select("id, sent_at, scheduled_for")
    .eq("user_id", userId)
    .eq("sequence_type", sequenceType)
    .eq("step_number", stepNumber)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const [primary, ...duplicates] = data;

  if (duplicates.length > 0) {
    await supabase
      .from("email_sequences")
      .delete()
      .in(
        "id",
        duplicates.map((row) => row.id),
      );
  }

  return primary;
}

async function deletePendingSequences({
  sequenceType,
  stepNumbers,
  supabase,
  userId,
}: {
  sequenceType: SequenceType;
  stepNumbers: number[];
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  await supabase
    .from("email_sequences")
    .delete()
    .eq("user_id", userId)
    .eq("sequence_type", sequenceType)
    .in("step_number", stepNumbers)
    .is("sent_at", null);
}

async function markSequenceSent(id: string) {
  const supabase = createAdminClient();

  await supabase
    .from("email_sequences")
    .update({
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);
}

function captureSequenceError(
  error: unknown,
  context: {
    sequenceType: SequenceType;
    stepNumber: number;
    userId: string;
  },
) {
  Sentry.withScope((scope) => {
    scope.setTag("sequence_type", context.sequenceType);
    scope.setTag("sequence_step", String(context.stepNumber));
    scope.setTag("user_id", context.userId);
    Sentry.captureException(error);
  });
}
