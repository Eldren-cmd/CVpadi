export interface IndustryTip {
  buildIndustry: string;
  certifications: [string, string, string];
  exampleBullets: [string, string, string];
  intro: string;
  mistakes: [string, string, string];
  nigerianContext: string;
  slug: string;
  title: string;
}

export const INDUSTRY_TIPS: IndustryTip[] = [
  {
    buildIndustry: "Banking",
    certifications: ["CIBN certificates", "ACCA or ICAN progress", "AML and compliance training"],
    exampleBullets: [
      "Grew deposits and customer accounts while keeping KYC quality high.",
      "Reduced approval rework by preparing complete customer and loan documentation.",
      "Handled escalations and improved turnaround time on branch customer issues.",
    ],
    intro:
      "Banking CVs in Nigeria work best when they show trust, process discipline, and measurable commercial impact quickly.",
    mistakes: [
      "Listing duties without target, deposit, recovery, or portfolio numbers.",
      "Hiding compliance, KYC, or audit exposure.",
      "Using a generic summary that does not sound like banking.",
    ],
    nigerianContext:
      "Commercial banks, microfinance institutions, and fintech lenders usually care about branch targets, customer growth, documentation quality, and regulatory awareness.",
    slug: "banking",
    title: "Banking",
  },
  {
    buildIndustry: "Engineering",
    certifications: ["COREN", "HSE levels", "AutoCAD, Revit, or project tools"],
    exampleBullets: [
      "Reduced machine downtime through preventive maintenance scheduling.",
      "Supported site supervision and closed snag items before handover.",
      "Prepared design revisions and coordinated vendor feedback on schedule.",
    ],
    intro:
      "Engineering CVs perform best when they show technical competence in a real operating environment.",
    mistakes: [
      "Writing only theory and coursework without project evidence.",
      "Leaving out tools, standards, and safety exposure.",
      "Mixing internship, NYSC, and full-time responsibility levels.",
    ],
    nigerianContext:
      "Construction, utilities, manufacturing, and field employers all pay attention to safety, documentation, equipment reliability, and results under pressure.",
    slug: "engineering",
    title: "Engineering",
  },
  {
    buildIndustry: "Healthcare",
    certifications: ["Relevant council registration", "BLS or ACLS", "Hospital information system training"],
    exampleBullets: [
      "Managed triage and patient documentation during high-volume shifts.",
      "Supported medication administration and patient monitoring with clean notes.",
      "Coordinated patient education and referral follow-up in clinic workflow.",
    ],
    intro:
      "Healthcare CVs must communicate clinical readiness, clean documentation habits, and patient-safety awareness from the first section.",
    mistakes: [
      "Forgetting to show registration or license status.",
      "Using only compassionate language without workflow evidence.",
      "Mixing unrelated volunteer work into the clinical core.",
    ],
    nigerianContext:
      "Hospitals, clinics, HMOs, and NGO health programmes want to know whether you can handle patient interaction, escalation, notes, and collaboration in resource-constrained settings.",
    slug: "healthcare",
    title: "Healthcare",
  },
  {
    buildIndustry: "Law",
    certifications: ["Nigerian Bar qualification", "ADR or arbitration training", "Compliance and governance courses"],
    exampleBullets: [
      "Drafted first-pass agreements and reduced turnaround on routine matters.",
      "Converted research findings into short advisory notes for review.",
      "Supported litigation files through bundling, review, and court-date coordination.",
    ],
    intro:
      "Law CVs in Nigeria should show judgment, drafting quality, and research depth rather than broad claims about being analytical.",
    mistakes: [
      "Hiding practice area focus.",
      "Treating moot-court and professional matter work as the same thing.",
      "Using long paragraphs instead of crisp proof.",
    ],
    nigerianContext:
      "Lean legal teams value people who can switch between research, drafting, review, filings, and stakeholder follow-up without dropping quality.",
    slug: "law",
    title: "Law",
  },
  {
    buildIndustry: "NGO",
    certifications: ["Project management training", "Monitoring and evaluation courses", "Safeguarding training"],
    exampleBullets: [
      "Submitted donor-ready activity reports on schedule across field locations.",
      "Improved beneficiary data cleanliness before monitoring review.",
      "Coordinated community and partner meetings to sustain programme participation.",
    ],
    intro:
      "NGO CVs need to prove implementation reality, not just mission language.",
    mistakes: [
      "Writing broad passion statements without programme evidence.",
      "Ignoring reporting and data-quality work.",
      "Listing volunteering without scope or results.",
    ],
    nigerianContext:
      "This sector rewards people who can move between field visits, beneficiary documentation, partner communication, and donor-facing reporting.",
    slug: "ngo",
    title: "NGO",
  },
  {
    buildIndustry: "Technology",
    certifications: ["Cloud or security certificates", "Product or agile training", "Portfolio projects and GitHub proof"],
    exampleBullets: [
      "Built internal workflow features that reduced manual review time.",
      "Resolved production bugs and improved release confidence.",
      "Analysed funnel data and improved activation on an onboarding flow.",
    ],
    intro:
      "Technology CVs stand out when they show shipped work, ownership, and learning velocity instead of a plain tools dump.",
    mistakes: [
      "Listing tools without real product context.",
      "Using internship bullets with no outcome.",
      "Choosing a flashy template while hiding proof.",
    ],
    nigerianContext:
      "Startups, banks, and outsourcing teams all care about execution. They want candidates who can ship, troubleshoot, collaborate, and communicate clearly.",
    slug: "tech",
    title: "Tech",
  },
  {
    buildIndustry: "Teaching",
    certifications: ["TRCN", "Classroom management training", "Curriculum and assessment courses"],
    exampleBullets: [
      "Improved student test performance across assessment terms.",
      "Managed classroom behaviour and parent communication with clean records.",
      "Introduced revision support sessions that raised pass rates.",
    ],
    intro:
      "Teaching CVs should make classroom results feel concrete through learner outcomes, planning quality, and record discipline.",
    mistakes: [
      "Writing only about love for teaching.",
      "Leaving out exam outcomes or classroom-management evidence.",
      "Burying teaching proof under unrelated admin tasks.",
    ],
    nigerianContext:
      "Private schools, tutoring businesses, and NGOs want educators who blend structure with empathy and can keep parents, records, and learner outcomes in good shape.",
    slug: "teaching",
    title: "Teaching",
  },
  {
    buildIndustry: "Oil and Gas",
    certifications: ["HSE certifications", "Industry safety cards", "Relevant compliance training"],
    exampleBullets: [
      "Supported maintenance planning on rotating equipment and reduced shutdown risk.",
      "Prepared safety documentation and toolbox-meeting records for field teams.",
      "Coordinated inspection follow-up to keep project timelines on track.",
    ],
    intro:
      "Oil and gas CVs win by proving safety discipline, operational reliability, and site readiness.",
    mistakes: [
      "Using broad engineering language without site or plant context.",
      "Leaving out permits, safety, and documentation habits.",
      "Focusing on team spirit instead of technical contribution.",
    ],
    nigerianContext:
      "Operators and contractors want people who can work within demanding HSE expectations while still moving operations forward in difficult conditions.",
    slug: "oil-gas",
    title: "Oil and Gas",
  },
  {
    buildIndustry: "Accounting",
    certifications: ["ICAN or ACCA", "ERP familiarity", "Tax and audit training"],
    exampleBullets: [
      "Prepared monthly reconciliations and reduced unresolved ledger differences.",
      "Supported statutory filing schedules and maintained clean audit support.",
      "Tracked payables and improved invoice turnaround visibility.",
    ],
    intro:
      "Accounting CVs should reassure the reader that your numbers can be trusted through controls, reporting timelines, and documentation quality.",
    mistakes: [
      "Listing software without showing reporting or control work.",
      "Talking about finance broadly instead of naming schedules and reconciliations.",
      "Leaving out exam progress when it strengthens your trajectory.",
    ],
    nigerianContext:
      "Lean accounting teams value candidates who can move between reconciliations, filing support, reporting packs, and vendor follow-up without losing accuracy.",
    slug: "accounting",
    title: "Accounting",
  },
  {
    buildIndustry: "Marketing",
    certifications: ["Digital marketing certificates", "Analytics training", "Brand or growth coursework"],
    exampleBullets: [
      "Executed social campaigns that increased qualified leads.",
      "Managed content calendars and improved publishing consistency.",
      "Adjusted creative or targeting to improve conversion efficiency.",
    ],
    intro:
      "Marketing CVs improve when they connect ideas to leads, traffic, engagement, or revenue instead of sounding energetic without proof.",
    mistakes: [
      "Describing campaigns without numbers or channels.",
      "Listing every platform instead of the ones used professionally.",
      "Hiding analytical ability and reporting work.",
    ],
    nigerianContext:
      "From startups to FMCG firms, employers reward marketers who understand execution speed, channel fit, and resource constraints.",
    slug: "marketing",
    title: "Marketing",
  },
];

export function getIndustryTip(slug: string) {
  return INDUSTRY_TIPS.find((tip) => tip.slug === slug);
}

export function getIndustryTipStaticParams() {
  return INDUSTRY_TIPS.map((tip) => ({ industry: tip.slug }));
}
