import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CVFormData, DegreeClass, ExperienceLevel, NyscStatus, RefereeEntry } from "@/lib/cv/types";
import { fontData } from "./font-data";

let fontsRegistered = false;

const GRADE_LABELS: Record<DegreeClass, string> = {
  credit: "Credit",
  distinction: "Distinction",
  first_class: "First Class",
  merit: "Merit",
  other: "Other",
  pass: "Pass",
  second_class_lower: "Second Class Lower",
  second_class_upper: "Second Class Upper",
  third_class: "Third Class",
};

const NYSC_STATUS_LABELS: Record<NyscStatus, string> = {
  discharged: "Discharged",
  exempted: "Exempted",
  not_yet: "Not yet served",
  ongoing: "Currently serving",
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry level",
  executive: "Executive",
  mid: "Mid level",
  senior: "Senior level",
};

function registerPdfFonts() {
  if (fontsRegistered) {
    return;
  }

  Font.register({
    family: "DM Sans",
    fonts: [
      {
        fontWeight: 400,
        src: `data:font/truetype;base64,${fontData.dmSans400}`,
      },
      {
        fontWeight: 500,
        src: `data:font/truetype;base64,${fontData.dmSans500}`,
      },
      {
        fontWeight: 700,
        src: `data:font/truetype;base64,${fontData.dmSans700}`,
      },
    ],
  });

  Font.register({
    family: "Playfair",
    fonts: [
      {
        fontWeight: 700,
        src: `data:font/truetype;base64,${fontData.playfair700}`,
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#1A1410",
    fontFamily: "DM Sans",
    fontSize: 10,
    lineHeight: 1.5,
    padding: 40,
  },
  header: {
    backgroundColor: "#D4501A",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  name: {
    color: "#FFFFFF",
    fontFamily: "Playfair",
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 4,
  },
  headerLine: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: "DM Sans",
    fontSize: 10,
    lineHeight: 1.35,
    marginBottom: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    borderBottomColor: "#D4501A",
    borderBottomWidth: 0.5,
    color: "#D4501A",
    fontFamily: "DM Sans",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 6,
    paddingBottom: 3,
    textTransform: "uppercase",
  },
  bodyText: {
    color: "#3D3530",
    fontFamily: "DM Sans",
    fontSize: 10,
    lineHeight: 1.5,
  },
  item: {
    marginBottom: 10,
  },
  itemTitle: {
    color: "#1A1410",
    fontFamily: "DM Sans",
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemRole: {
    color: "#D4501A",
    fontFamily: "DM Sans",
    fontSize: 10,
    marginBottom: 2,
  },
  itemMeta: {
    color: "#5C4F3D",
    fontFamily: "DM Sans",
    fontSize: 10,
    marginBottom: 3,
  },
  itemDescription: {
    color: "#3D3530",
    fontFamily: "DM Sans",
    fontSize: 10,
    lineHeight: 1.5,
  },
  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillChip: {
    backgroundColor: "#F6F2EB",
    borderColor: "#DED6C8",
    borderWidth: 1,
    borderRadius: 4,
    color: "#3D3530",
    fontFamily: "DM Sans",
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  refereeGrid: {
    flexDirection: "row",
    gap: 14,
  },
  refereeColumn: {
    flexGrow: 1,
    width: "50%",
  },
  watermarkLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  watermarkRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 120,
    width: "100%",
  },
  watermarkText: {
    color: "rgba(212,80,26,0.08)",
    fontFamily: "DM Sans",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 4,
    textTransform: "uppercase",
    transform: "rotate(-35deg)",
  },
  footerFingerprint: {
    bottom: 8,
    color: "#FFFFFF",
    fontFamily: "DM Sans",
    fontSize: 1,
    left: 12,
    position: "absolute",
  },
});

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function joinValues(
  values: Array<string | null | undefined>,
  separator = " · ",
) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(separator);
}

function formatGrade(value: string) {
  return GRADE_LABELS[value as DegreeClass] || value.replace(/_/g, " ");
}

function formatNysc(value: string) {
  return NYSC_STATUS_LABELS[value as NyscStatus] || value.replace(/_/g, " ");
}

function formatExperience(value: string) {
  return EXPERIENCE_LABELS[value as ExperienceLevel] || value.replace(/_/g, " ");
}

function normalizeObjective(formData: CVFormData) {
  return formData.aiEnhancedObjective?.trim() || formData.careerObjective.trim();
}

function normalizeSkills(formData: CVFormData) {
  const seen = new Set<string>();
  const merged = [...(formData.aiSuggestedSkills ?? []), ...formData.skills];

  return merged
    .map((skill) => skill.trim())
    .filter((skill) => {
      if (!skill) {
        return false;
      }

      const key = skill.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function normalizeLanguages(formData: CVFormData) {
  return formData.languages
    .map((language) => language.trim())
    .filter(Boolean);
}

function normalizeEducation(formData: CVFormData) {
  return formData.education.filter((entry) =>
    Boolean(
      entry.institution.trim() ||
      entry.course.trim() ||
      entry.degreeClass ||
      entry.year.trim(),
    ),
  );
}

function normalizeWorkExperience(formData: CVFormData) {
  if (formData.noExperienceYet) {
    return [] as Array<{
      company: string;
      endDate: string;
      id: string;
      responsibilities: string[];
      role: string;
      startDate: string;
    }>;
  }

  return formData.workExperience
    .map((entry) => ({
      company: entry.company.trim(),
      endDate: entry.endDate.trim(),
      id: entry.id,
      responsibilities: entry.responsibilities
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
      role: entry.role.trim(),
      startDate: entry.startDate.trim(),
    }))
    .filter((entry) =>
      Boolean(
        entry.company ||
        entry.role ||
        entry.startDate ||
        entry.endDate ||
        entry.responsibilities.length > 0,
      ),
    );
}

function normalizeCertifications(formData: CVFormData) {
  return formData.certifications
    .map((entry) => ({
      id: entry.id,
      issuer: entry.issuer.trim(),
      name: entry.name.trim(),
      year: entry.year.trim(),
    }))
    .filter((entry) => Boolean(entry.name || entry.issuer || entry.year));
}

function hasRefereeContent(referee: RefereeEntry) {
  return Boolean(
    referee.name.trim() ||
    referee.title.trim() ||
    referee.company.trim() ||
    referee.phone.trim() ||
    referee.email.trim(),
  );
}

function normalizeReferees(formData: CVFormData) {
  return [formData.refereeOne, formData.refereeTwo]
    .map((referee) => ({
      company: referee.company.trim(),
      email: referee.email.trim(),
      name: referee.name.trim(),
      phone: referee.phone.trim(),
      title: referee.title.trim(),
    }))
    .filter((referee) =>
      hasRefereeContent({
        ...referee,
      }),
    );
}

function getStateOfOrigin(formData: CVFormData) {
  const source = formData as unknown as Record<string, unknown>;
  return getString(source.stateOfOrigin) || getString(source.state_of_origin);
}

export function CVPdfDocument({
  fingerprint,
  formData,
  watermarked = false,
}: {
  fingerprint: string;
  formData: CVFormData;
  watermarked?: boolean;
}) {
  registerPdfFonts();

  const objective = normalizeObjective(formData);
  const skills = normalizeSkills(formData);
  const languages = normalizeLanguages(formData);
  const education = normalizeEducation(formData);
  const workExperience = normalizeWorkExperience(formData);
  const certifications = normalizeCertifications(formData);
  const referees = normalizeReferees(formData);
  const location = joinValues([formData.locationCity, formData.locationState], ", ");
  const headerContactLine = joinValues([formData.email, formData.phone, location], " · ");
  const dateOfBirth = formData.dateOfBirth.trim();
  const stateOfOrigin = getStateOfOrigin(formData);
  const headerMetaLine = joinValues(
    [
      dateOfBirth ? `Date of birth: ${dateOfBirth}` : "",
      stateOfOrigin ? `State of origin: ${stateOfOrigin}` : "",
    ],
    " | ",
  );
  const profileSummary = joinValues(
    [
      `Experience level: ${formatExperience(formData.experienceLevel)}`,
      `NYSC: ${formatNysc(formData.nyscStatus)}`,
    ],
    " · ",
  );

  return (
    <Document author="CVPadi" title={`${formData.fullName || "CVPadi User"} CV`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{formData.fullName.trim()}</Text>
          {headerContactLine ? (
            <Text style={styles.headerLine}>{headerContactLine}</Text>
          ) : null}
          {headerMetaLine ? (
            <Text style={styles.headerLine}>{headerMetaLine}</Text>
          ) : null}
        </View>

        {profileSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <Text style={styles.bodyText}>{profileSummary}</Text>
          </View>
        ) : null}

        {objective ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Objective</Text>
            <Text style={styles.bodyText}>{objective}</Text>
          </View>
        ) : null}

        {workExperience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {workExperience.map((entry) => (
              <View key={entry.id} style={styles.item}>
                {entry.company ? (
                  <Text style={styles.itemTitle}>{entry.company}</Text>
                ) : null}
                {entry.role ? (
                  <Text style={styles.itemRole}>{entry.role}</Text>
                ) : null}
                {joinValues([entry.startDate, entry.endDate], " – ") ? (
                  <Text style={styles.itemMeta}>
                    {joinValues([entry.startDate, entry.endDate], " – ")}
                  </Text>
                ) : null}
                {entry.responsibilities.map((line, lineIndex) => (
                  <Text key={`${entry.id}_${lineIndex}`} style={styles.itemDescription}>
                    {line}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((entry) => {
              const details = joinValues(
                [
                  entry.course.trim(),
                  entry.degreeClass ? formatGrade(entry.degreeClass) : "",
                  entry.year.trim(),
                ],
                " | ",
              );

              return (
                <View key={entry.id} style={styles.item}>
                  {entry.institution.trim() ? (
                    <Text style={styles.itemTitle}>{entry.institution.trim()}</Text>
                  ) : null}
                  {details ? (
                    <Text style={styles.itemMeta}>{details}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillWrap}>
              {skills.map((skill) => (
                <Text key={skill} style={styles.skillChip}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.bodyText}>{languages.join(", ")}</Text>
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((entry) => {
              const details = joinValues([entry.issuer, entry.year], " | ");

              return (
                <View key={entry.id} style={styles.item}>
                  {entry.name ? (
                    <Text style={styles.itemTitle}>{entry.name}</Text>
                  ) : null}
                  {details ? (
                    <Text style={styles.itemMeta}>{details}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {referees.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referees</Text>
            <View style={styles.refereeGrid}>
              {referees.map((referee, index) => (
                <View key={`referee_${index}`} style={styles.refereeColumn}>
                  {referee.name ? (
                    <Text style={styles.itemTitle}>{referee.name}</Text>
                  ) : null}
                  {joinValues([referee.title, referee.company], " | ") ? (
                    <Text style={styles.itemMeta}>
                      {joinValues([referee.title, referee.company], " | ")}
                    </Text>
                  ) : null}
                  {joinValues([referee.phone, referee.email], " | ") ? (
                    <Text style={styles.bodyText}>
                      {joinValues([referee.phone, referee.email], " | ")}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {watermarked ? (
          <View fixed style={styles.watermarkLayer}>
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <View key={`wm_row_${rowIndex}`} style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>CVPadi Preview</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footerFingerprint}>{fingerprint}</Text>
      </Page>
    </Document>
  );
}
