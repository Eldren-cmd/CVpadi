import type { CSSProperties, ReactNode } from "react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const shellStyle: CSSProperties = {
  backgroundColor: "#F5F0E8",
  color: "#1A1410",
  fontFamily: "DM Sans, Arial, sans-serif",
  margin: 0,
  padding: "32px 16px",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#FDFAF4",
  border: "1px solid #DDD5C4",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "640px",
  padding: "32px",
};

const eyebrowStyle: CSSProperties = {
  color: "#5C4F3D",
  fontFamily: "DM Mono, monospace",
  fontSize: "12px",
  letterSpacing: "0.24em",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const headingStyle: CSSProperties = {
  color: "#1A1410",
  fontFamily: "Playfair Display, Georgia, serif",
  fontSize: "30px",
  lineHeight: 1.2,
  margin: "0 0 16px",
};

const bodyStyle: CSSProperties = {
  color: "#5C4F3D",
  fontSize: "15px",
  lineHeight: 1.7,
  margin: "0 0 20px",
};

const ctaStyle: CSSProperties = {
  backgroundColor: "#D4501A",
  borderRadius: "6px",
  color: "#FFFFFF",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 18px",
  textDecoration: "none",
};

const secondaryCtaStyle: CSSProperties = {
  ...ctaStyle,
  backgroundColor: "#FDFAF4",
  border: "1px solid #DDD5C4",
  color: "#1A1410",
  marginLeft: "12px",
};

const listStyle: CSSProperties = {
  color: "#5C4F3D",
  fontSize: "15px",
  lineHeight: 1.7,
  margin: "0 0 20px",
  paddingLeft: "20px",
};

const footerStyle: CSSProperties = {
  borderTop: "1px solid #EDE8DC",
  color: "#5C4F3D",
  fontSize: "13px",
  lineHeight: 1.7,
  marginTop: "28px",
  paddingTop: "18px",
};

function EmailLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <p style={eyebrowStyle}>CVPadi</p>
        <h1 style={headingStyle}>{title}</h1>
        {children}
        <div style={footerStyle}>
          <p style={{ margin: "0 0 10px" }}>
            You can manage your email preferences in the CVPadi preference centre.
          </p>
          <a href={`${appUrl}/email-preferences`} style={{ color: "#1A4A8A" }}>
            Open preference centre
          </a>
        </div>
      </div>
    </div>
  );
}

export function ResumeSavedEmail({
  fullName,
  resumeUrl,
}: {
  fullName: string;
  resumeUrl: string;
}) {
  return (
    <EmailLayout title={`Your CV is being saved, ${fullName || "there"}.`}>
      <p style={bodyStyle}>
        We captured your email and your draft is safely stored. Pick up where you left off
        whenever you have a stronger signal or more time.
      </p>
      <a href={resumeUrl} style={ctaStyle}>
        Resume your CV
      </a>
      <p style={{ ...bodyStyle, marginTop: "20px" }}>
        If the button asks you to sign in, use the same email with your password, magic
        link, or Google.
      </p>
    </EmailLayout>
  );
}

export function AbandonmentSequenceEmail({
  adviceTitle,
  adviceBody,
  ctaHref,
  ctaLabel,
  intro,
}: {
  adviceBody: string;
  adviceTitle: string;
  ctaHref: string;
  ctaLabel: string;
  intro: string;
}) {
  return (
    <EmailLayout title="Your CV draft is still waiting for you.">
      <p style={bodyStyle}>{intro}</p>
      <div
        style={{
          backgroundColor: "#F4EAD0",
          borderRadius: "6px",
          marginBottom: "20px",
          padding: "18px",
        }}
      >
        <p style={{ ...eyebrowStyle, color: "#C8941A", marginBottom: "8px" }}>Tip</p>
        <p style={{ ...bodyStyle, color: "#1A1410", marginBottom: "8px" }}>{adviceTitle}</p>
        <p style={{ ...bodyStyle, marginBottom: 0 }}>{adviceBody}</p>
      </div>
      <a href={ctaHref} style={ctaStyle}>
        {ctaLabel}
      </a>
    </EmailLayout>
  );
}

export function CvReadyEmail({
  fullName,
  jpgUrl,
  pdfUrl,
}: {
  fullName: string;
  jpgUrl: string;
  pdfUrl: string;
}) {
  return (
    <EmailLayout title={`Your CV is ready, ${fullName || "there"}.`}>
      <p style={bodyStyle}>
        Your PDF and WhatsApp-ready JPG are attached as secure download links. These links
        expire in 2 hours.
      </p>
      <div>
        <a href={pdfUrl} style={ctaStyle}>
          Download PDF
        </a>
        <a href={jpgUrl} style={secondaryCtaStyle}>
          Open WhatsApp JPG
        </a>
      </div>
      <p style={{ ...bodyStyle, marginTop: "20px" }}>
        Development note: while you are still using Resend&apos;s test sender, delivery only
        reaches the verified Resend inbox.
      </p>
    </EmailLayout>
  );
}

export function AiEnhancedCvReadyEmail({
  fullName,
  jpgUrl,
  pdfUrl,
}: {
  fullName: string;
  jpgUrl: string;
  pdfUrl: string;
}) {
  return (
    <EmailLayout title={`Your AI-enhanced CV is ready, ${fullName || "there"}.`}>
      <p style={bodyStyle}>
        CVPadi has refreshed your career objective and suggested stronger role-fit skills.
        Your updated PDF and WhatsApp-ready JPG are live now and expire in 2 hours.
      </p>
      <div>
        <a href={pdfUrl} style={ctaStyle}>
          Download updated PDF
        </a>
        <a href={jpgUrl} style={secondaryCtaStyle}>
          Open updated JPG
        </a>
      </div>
      <p style={{ ...bodyStyle, marginTop: "20px" }}>
        Keep your original draft details accurate. The AI pass only improves the objective
        wording and surfaces missing skills; it does not replace your experience history.
      </p>
    </EmailLayout>
  );
}

export function PostDownloadReminderEmail({
  buildUrl,
  fullName,
}: {
  buildUrl: string;
  fullName: string;
}) {
  return (
    <EmailLayout title={`Need to tweak anything, ${fullName || "there"}?`}>
      <p style={bodyStyle}>
        Edits are free inside your draft. If you want a fresh paid download after those
        edits, the re-download price is N500.
      </p>
      <a href={buildUrl} style={ctaStyle}>
        Edit your CV
      </a>
    </EmailLayout>
  );
}

export function JobsDigestScaffoldEmail({
  buildUrl,
  industry,
}: {
  buildUrl: string;
  industry: string;
}) {
  const focusAreas = getRoleFocusAreas(industry);

  return (
    <EmailLayout title="Your early jobs digest is taking shape.">
      <p style={bodyStyle}>
        The full job-matching engine lands in the next phase. For now, these are the role
        patterns CVPadi will prioritise for you based on your profile.
      </p>
      <ul style={listStyle}>
        {focusAreas.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <a href={buildUrl} style={ctaStyle}>
        Keep your CV updated
      </a>
    </EmailLayout>
  );
}

function getRoleFocusAreas(industry: string) {
  switch (industry.toLowerCase()) {
    case "technology":
      return [
        "Product and software roles that match your current skill stack",
        "Ops and support roles where clean documentation matters",
        "Growth-stage teams hiring for execution rather than prestige pedigree",
      ];
    case "finance":
      return [
        "Analyst roles with strong reporting and spreadsheet expectations",
        "Operations roles where accuracy and turnaround time matter",
        "Commercial teams looking for solid communication and trust",
      ];
    default:
      return [
        `${industry || "Career"} roles that reward a clear, complete CV`,
        "Employers who screen heavily for NYSC status and referee quality",
        "Openings where a cleaner CV can move you into interview review faster",
      ];
  }
}
