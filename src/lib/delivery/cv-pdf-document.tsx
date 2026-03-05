import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CVFormData, DegreeClass, ExperienceLevel, NyscStatus } from "@/lib/cv/types";
import { fontData } from "./font-data";

type LooseRecord = Record<string, unknown>;

interface NormalizedEducationEntry {
  course: string;
  degreeClass: string;
  id: string;
  institution: string;
  year: string;
}

interface NormalizedExperienceEntry {
  company: string;
  endDate: string;
  id: string;
  responsibilities: string[];
  role: string;
  startDate: string;
}

interface NormalizedCertificationEntry {
  id: string;
  issuer: string;
  name: string;
  year: string;
}

interface NormalizedRefereeEntry {
  company: string;
  email: string;
  name: string;
  phone: string;
  title: string;
}

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

const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
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
    marginBottom: 16,
  },
  name: {
    color: "#1A1410",
    fontFamily: "Playfair",
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 4,
  },
  headerLine: {
    color: "#5C4F3D",
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#F6F2EB",
    borderColor: "#DED6C8",
    borderWidth: 1,
    borderRadius: 4,
    color: "#3D3530",
    fontFamily: "DM Sans",
    fontSize: 9,
    marginBottom: 6,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  refereeGrid: {
    flexDirection: "row",
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

function getRecord(value: unknown): LooseRecord {
  if (value && typeof value === "object") {
    return value as LooseRecord;
  }

  return {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(record: LooseRecord, keys: string[]) {
  for (const key of keys) {
    const value = getString(record[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function joinValues(
  values: Array<string | null | undefined>,
  separator = " \u00B7 ",
) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(separator);
}

const formatGrade = (g: string) => {
  const grades: Record<string, string> = {
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
  return grades[g] ?? GRADE_LABELS[g as DegreeClass] ?? g.replace(/_/g, " ");
};

const formatNysc = (s: string) => {
  const statuses: Record<string, string> = {
    discharged: "Discharged",
    exempted: "Exempted",
    not_yet: "Not yet served",
    ongoing: "Currently serving",
  };
  return statuses[s] ?? NYSC_STATUS_LABELS[s as NyscStatus] ?? s.replace(/_/g, " ");
};

const formatLevel = (l: string) => {
  const levels: Record<string, string> = {
    entry: "Entry level",
    executive: "Executive",
    mid: "Mid level",
    senior: "Senior level",
  };
  return levels[l] ?? EXPERIENCE_LEVEL_LABELS[l as ExperienceLevel] ?? l.replace(/_/g, " ");
};

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
  return formData.education
    .map((entry, index): NormalizedEducationEntry => {
      const record = getRecord(entry);
      return {
        course:
          getOptionalString(record, ["course_of_study", "course", "courseOfStudy"])
          || entry.course.trim(),
        degreeClass:
          getOptionalString(record, ["grade", "degreeClass", "degree_class"])
          || entry.degreeClass,
        id: getOptionalString(record, ["id"]) || entry.id || `edu_${index}`,
        institution: getOptionalString(record, ["institution", "school"]) || entry.institution.trim(),
        year:
          getOptionalString(record, ["graduation_year", "graduationYear", "year"])
          || entry.year.trim(),
      };
    })
    .filter((entry) =>
      Boolean(entry.institution || entry.course || entry.degreeClass || entry.year),
    );
}

function normalizeWorkExperience(formData: CVFormData) {
  if (formData.noExperienceYet) {
    return [] as NormalizedExperienceEntry[];
  }

  return formData.workExperience
    .map((entry, index): NormalizedExperienceEntry => {
      const record = getRecord(entry);
      const responsibilitiesRaw =
        getOptionalString(record, ["responsibilities", "description", "achievements"])
        || entry.responsibilities;

      return {
        company: getOptionalString(record, ["company"]) || entry.company.trim(),
        endDate: getOptionalString(record, ["end_date", "endDate"]) || entry.endDate.trim(),
        id: getOptionalString(record, ["id"]) || entry.id || `exp_${index}`,
        responsibilities: responsibilitiesRaw
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
        role: getOptionalString(record, ["role", "position"]) || entry.role.trim(),
        startDate: getOptionalString(record, ["start_date", "startDate"]) || entry.startDate.trim(),
      };
    })
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
    .map((entry, index): NormalizedCertificationEntry => {
      const record = getRecord(entry);
      return {
        id: getOptionalString(record, ["id"]) || entry.id || `cert_${index}`,
        issuer:
          getOptionalString(record, ["issuer", "issuing_body", "issuingBody"])
          || entry.issuer.trim(),
        name: getOptionalString(record, ["name"]) || entry.name.trim(),
        year: getOptionalString(record, ["year"]) || entry.year.trim(),
      };
    })
    .filter((entry) => Boolean(entry.name || entry.issuer || entry.year));
}

function normalizeReferees(formData: CVFormData, source: LooseRecord) {
  const sourceReferees = Array.isArray(source.referees) ? source.referees : null;
  const fallbackReferees = [formData.refereeOne, formData.refereeTwo];
  const rawReferees = sourceReferees ?? fallbackReferees;

  return rawReferees
    .map((entry) => {
      const record = getRecord(entry);

      return {
        company: getOptionalString(record, ["company"]),
        email: getOptionalString(record, ["email"]),
        name: getOptionalString(record, ["name"]),
        phone: getOptionalString(record, ["phone"]),
        title: getOptionalString(record, ["title"]),
      } satisfies NormalizedRefereeEntry;
    })
    .filter((entry) =>
      Boolean(entry.name || entry.title || entry.company || entry.phone || entry.email),
    );
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

  const source = getRecord(formData as unknown);
  const fullName = getOptionalString(source, ["full_name", "fullName"]) || formData.fullName.trim();
  const locationCity = getOptionalString(source, ["location_city", "locationCity"]) || formData.locationCity.trim();
  const locationState = getOptionalString(source, ["location_state", "locationState"]) || formData.locationState.trim();
  const phone = getOptionalString(source, ["phone"]) || formData.phone.trim();
  const email = getOptionalString(source, ["email"]) || formData.email.trim();
  const nyscStatus = getOptionalString(source, ["nysc_status", "nyscStatus"]) || formData.nyscStatus;
  const industry = getOptionalString(source, ["industry"]) || formData.industry.trim();
  const experienceLevel = getOptionalString(source, ["experience_level", "experienceLevel"]) || formData.experienceLevel;

  const objective = normalizeObjective(formData);
  const skills = normalizeSkills(formData);
  const languages = normalizeLanguages(formData);
  const education = normalizeEducation(formData);
  const workExperience = normalizeWorkExperience(formData);
  const certifications = normalizeCertifications(formData);
  const referees = normalizeReferees(formData, source);

  const contactLine = joinValues(
    [locationCity, locationState, phone, email],
    " \u00B7 ",
  );

  const professionalDetails = joinValues(
    [
      industry ? `Industry: ${industry}` : "",
      experienceLevel ? `Experience level: ${formatLevel(experienceLevel)}` : "",
    ],
    " \u00B7 ",
  );

  return (
    <Document author="CVPadi" title={`${fullName || "CVPadi User"} CV`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>

          {contactLine ? (
            <Text style={styles.headerLine}>{contactLine}</Text>
          ) : null}

          {nyscStatus ? (
            <Text style={styles.headerLine}>NYSC: {formatNysc(nyscStatus)}</Text>
          ) : null}
        </View>

        {professionalDetails ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <Text style={styles.bodyText}>{professionalDetails}</Text>
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

                {joinValues([entry.startDate, entry.endDate], " - ") ? (
                  <Text style={styles.itemMeta}>{joinValues([entry.startDate, entry.endDate], " - ")}</Text>
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
            {education.map((edu) => (
              <View key={edu.id} style={styles.item}>
                {edu.institution ? (
                  <Text style={styles.itemTitle}>{edu.institution}</Text>
                ) : null}

                {joinValues(
                  [
                    edu.course,
                    edu.degreeClass ? formatGrade(edu.degreeClass) : "",
                    edu.year,
                  ],
                  " \u00B7 ",
                ) ? (
                  <Text style={styles.itemMeta}>
                    {joinValues(
                      [
                        edu.course,
                        edu.degreeClass ? formatGrade(edu.degreeClass) : "",
                        edu.year,
                      ],
                      " \u00B7 ",
                    )}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.chipRow}>
              {skills.map((skill) => (
                <Text key={skill} style={styles.chip}>
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
