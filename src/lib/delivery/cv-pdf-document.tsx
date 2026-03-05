import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CVFormData } from "@/lib/cv/types";
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
    paddingBottom: 28,
    paddingHorizontal: 40,
    paddingTop: 32,
  },
  name: {
    color: "#FFFFFF",
    fontFamily: "Playfair",
    fontSize: 26,
    fontWeight: 700,
  },
  headerContactLine: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "DM Sans",
    fontSize: 10,
    lineHeight: 1.35,
    marginTop: 6,
  },
  headerNyscLine: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "DM Sans",
    fontSize: 10,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    borderBottomColor: "#D4501A",
    borderBottomWidth: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
  },
  sectionHeaderText: {
    color: "#D4501A",
    fontFamily: "DM Sans",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
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
    backgroundColor: "#F5F0E4",
    borderColor: "#DDD5C4",
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 6,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    color: "#3D3530",
    fontFamily: "DM Sans",
    fontSize: 9,
  },
  refereeGrid: {
    flexDirection: "row",
  },
  refereeColumn: {
    flex: 1,
  },
  refereeColumnGap: {
    marginRight: 20,
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
  return ({
    credit: "Credit",
    distinction: "Distinction",
    first_class: "First Class",
    merit: "Merit",
    pass: "Pass",
    second_class_lower: "Second Class Lower",
    second_class_upper: "Second Class Upper",
    third_class: "Third Class",
  } as Record<string, string>)[g] ?? g;
};

const formatNysc = (s: string) => {
  return ({
    discharged: "Discharged",
    exempted: "Exempted",
    not_yet: "Not yet served",
    ongoing: "Currently serving",
  } as Record<string, string>)[s] ?? s;
};

const SectionHeader = ({ children }: { children: string }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeaderText}>{children}</Text>
  </View>
);

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

  return (
    <Document author="CVPadi" title={`${fullName || "CVPadi User"} CV`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>

          {contactLine ? (
            <Text style={styles.headerContactLine}>{contactLine}</Text>
          ) : null}

          {nyscStatus ? (
            <Text style={styles.headerNyscLine}>NYSC: {formatNysc(nyscStatus)}</Text>
          ) : null}
        </View>

        {objective ? (
          <View style={styles.section}>
            <SectionHeader>Career Objective</SectionHeader>
            <Text style={styles.bodyText}>{objective}</Text>
          </View>
        ) : null}

        {workExperience.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Work Experience</SectionHeader>
            {workExperience.map((entry) => (
              <View key={entry.id} style={styles.item}>
                {entry.company ? (
                  <Text style={styles.itemTitle}>{entry.company}</Text>
                ) : null}

                {entry.role ? (
                  <Text style={styles.itemRole}>{entry.role}</Text>
                ) : null}

                {entry.startDate || entry.endDate ? (
                  <Text style={styles.itemMeta}>
                    {entry.startDate}
                    {entry.startDate || entry.endDate ? " \u2013 " : ""}
                    {entry.endDate || "Present"}
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
            <SectionHeader>Education</SectionHeader>
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
            <SectionHeader>Skills</SectionHeader>
            <View style={styles.chipRow}>
              {skills.map((skill) => (
                <View key={skill} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {languages.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Languages</SectionHeader>
            <Text style={styles.bodyText}>{languages.join(", ")}</Text>
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Certifications</SectionHeader>
            {certifications.map((entry) => {
              const details = joinValues([entry.issuer, entry.year], " \u00B7 ");

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
            <SectionHeader>Referees</SectionHeader>
            <View style={styles.refereeGrid}>
              {referees.slice(0, 2).map((referee, index) => (
                <View
                  key={`referee_${index}`}
                  style={index === 0 ? [styles.refereeColumn, styles.refereeColumnGap] : styles.refereeColumn}
                >
                  {referee.name ? (
                    <Text style={styles.itemTitle}>{referee.name}</Text>
                  ) : null}
                  {referee.title ? (
                    <Text style={styles.itemMeta}>{referee.title}</Text>
                  ) : null}
                  {referee.company ? (
                    <Text style={styles.itemMeta}>{referee.company}</Text>
                  ) : null}
                  {referee.phone ? (
                    <Text style={styles.bodyText}>{referee.phone}</Text>
                  ) : null}
                  {referee.email ? (
                    <Text style={styles.bodyText}>{referee.email}</Text>
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
