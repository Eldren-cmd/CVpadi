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

let fontsRegistered = false;

function registerPdfFonts() {
  if (fontsRegistered) {
    return;
  }

  Font.register({
    family: "DM Sans",
    fonts: [
      {
        src: `data:font/truetype;base64,${fontData.dmSans400}`,
        fontWeight: 400,
      },
      {
        src: `data:font/truetype;base64,${fontData.dmSans500}`,
        fontWeight: 500,
      },
      {
        src: `data:font/truetype;base64,${fontData.dmSans700}`,
        fontWeight: 700,
      },
    ],
  });

  Font.register({
    family: "Playfair",
    fonts: [
      {
        src: `data:font/truetype;base64,${fontData.playfair700}`,
        fontWeight: 700,
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FDFAF4",
    color: "#1A1410",
    fontFamily: "DM Sans",
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.45,
    paddingBottom: 28,
    paddingHorizontal: 28,
    paddingTop: 30,
  },
  hero: {
    borderBottom: "1 solid #DDD5C4",
    marginBottom: 16,
    paddingBottom: 14,
  },
  heading: {
    color: "#1A1410",
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 23,
    marginBottom: 5,
  },
  metaRow: {
    color: "#5C4F3D",
    fontFamily: "DM Sans",
    fontWeight: 400,
    fontSize: 10,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  badge: {
    backgroundColor: "#F4E4D8",
    borderRadius: 4,
    color: "#D4501A",
    fontSize: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    borderBottom: "1 solid #EDE8DC",
    color: "#D4501A",
    fontFamily: "DM Sans",
    fontWeight: 700,
    fontSize: 11,
    marginBottom: 7,
    paddingBottom: 4,
    textTransform: "uppercase",
  },
  paragraph: {
    color: "#5C4F3D",
    fontFamily: "DM Sans",
    fontWeight: 400,
    fontSize: 10,
  },
  item: {
    marginBottom: 8,
  },
  itemTitle: {
    color: "#1A1410",
    fontFamily: "DM Sans",
    fontWeight: 700,
    fontSize: 10,
    marginBottom: 2,
  },
  itemMeta: {
    color: "#5C4F3D",
    fontFamily: "DM Sans",
    fontWeight: 400,
    fontSize: 9,
    marginBottom: 2,
  },
  bullet: {
    color: "#5C4F3D",
    fontFamily: "DM Sans",
    fontWeight: 400,
    fontSize: 9,
    marginBottom: 2,
    paddingLeft: 8,
  },
  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillChip: {
    backgroundColor: "#F5F0E8",
    borderRadius: 4,
    color: "#1A1410",
    fontFamily: "DM Sans",
    fontWeight: 500,
    fontSize: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  refereeGrid: {
    flexDirection: "row",
    gap: 14,
  },
  refereeColumn: {
    flexGrow: 1,
    width: "50%",
  },
  footerFingerprint: {
    bottom: 10,
    color: "#FFFFFF",
    fontFamily: "DM Sans",
    fontWeight: 400,
    fontSize: 1,
    left: 28,
    position: "absolute",
  },
});

function joinValues(values: Array<string | undefined | null>) {
  return values.filter(Boolean).join(" | ");
}

function renderResponsibilityLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`);
}

function getDisplayObjective(formData: CVFormData) {
  return formData.aiEnhancedObjective || formData.careerObjective || "Career objective not provided yet.";
}

function getDisplaySkills(formData: CVFormData) {
  const seen = new Set<string>();

  return [...(formData.aiSuggestedSkills || []), ...formData.skills].filter((skill) => {
    const normalized = skill.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function renderRefereeBlock(label: string, data: CVFormData["refereeOne"]) {
  return (
    <View style={styles.refereeColumn}>
      <Text style={styles.itemTitle}>{label}</Text>
      <Text style={styles.itemMeta}>{data.name || "Name pending"}</Text>
      <Text style={styles.paragraph}>{joinValues([data.title, data.company])}</Text>
      <Text style={styles.paragraph}>{joinValues([data.phone, data.email])}</Text>
    </View>
  );
}

export function CVPdfDocument({
  fingerprint,
  formData,
}: {
  fingerprint: string;
  formData: CVFormData;
}) {
  registerPdfFonts();

  const displayObjective = getDisplayObjective(formData);
  const displaySkills = getDisplaySkills(formData);

  return (
    <Document author="CVPadi" title={`${formData.fullName || "CVPadi User"} CV`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.heading}>{formData.fullName || "Your CV"}</Text>
          <Text style={styles.metaRow}>
            {joinValues([
              formData.locationCity,
              formData.locationState,
              formData.phone,
              formData.email,
            ])}
          </Text>
          <Text style={styles.metaRow}>
            {joinValues([
              formData.industry,
              formData.experienceLevel,
              `NYSC: ${formData.nyscStatus}`,
            ])}
          </Text>
          <View style={styles.badgeRow}>
            {displaySkills.slice(0, 6).map((skill) => (
              <Text key={skill} style={styles.badge}>
                {skill}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Objective</Text>
          <Text style={styles.paragraph}>{displayObjective}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          {formData.noExperienceYet ? (
            <Text style={styles.paragraph}>Entry-level candidate. Experience section intentionally empty.</Text>
          ) : (
            formData.workExperience.map((entry) => (
              <View key={entry.id} style={styles.item}>
                <Text style={styles.itemTitle}>{joinValues([entry.role, entry.company])}</Text>
                <Text style={styles.itemMeta}>{joinValues([entry.startDate, entry.endDate])}</Text>
                {renderResponsibilityLines(entry.responsibilities || "Responsibilities pending.").map((line) => (
                  <Text key={`${entry.id}_${line}`} style={styles.bullet}>
                    {line}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {formData.education.map((entry) => (
            <View key={entry.id} style={styles.item}>
              <Text style={styles.itemTitle}>{entry.institution || "Institution pending"}</Text>
              <Text style={styles.itemMeta}>
                {joinValues([entry.course, entry.degreeClass, entry.year])}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Languages</Text>
          <View style={styles.skillWrap}>
            {displaySkills.map((skill) => (
              <Text key={skill} style={styles.skillChip}>
                {skill}
              </Text>
            ))}
            {formData.languages.map((language) => (
              <Text key={language} style={styles.skillChip}>
                {language}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {formData.certifications.map((entry) => (
            <View key={entry.id} style={styles.item}>
              <Text style={styles.itemTitle}>{entry.name || "Certification pending"}</Text>
              <Text style={styles.itemMeta}>{joinValues([entry.issuer, entry.year])}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referees</Text>
          <View style={styles.refereeGrid}>
            {renderRefereeBlock("Referee 1", formData.refereeOne)}
            {renderRefereeBlock("Referee 2", formData.refereeTwo)}
          </View>
        </View>

        <Text style={styles.footerFingerprint}>{fingerprint}</Text>
      </Page>
    </Document>
  );
}
