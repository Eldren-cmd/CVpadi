import type {
  CertificationEntry,
  CVFormData,
  EducationEntry,
  ExperienceEntry,
  RefereeEntry,
} from "./types";

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Abuja (FCT)",
] as const;

export const NIGERIAN_CITIES: Record<string, string[]> = {
  Abia: ["Umuahia", "Aba", "Ohafia", "Arochukwu"],
  Adamawa: ["Yola", "Mubi", "Numan", "Jimeta"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron"],
  Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"],
  Bauchi: ["Bauchi", "Azare", "Misau", "Jama'are"],
  Bayelsa: ["Yenagoa", "Brass", "Ogbia", "Sagbama"],
  Benue: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"],
  Borno: ["Maiduguri", "Biu", "Konduga", "Jere"],
  "Cross River": ["Calabar", "Ikom", "Ogoja", "Ugep"],
  Delta: ["Asaba", "Warri", "Sapele", "Ughelli"],
  Ebonyi: ["Abakaliki", "Afikpo", "Onueke", "Ikwo"],
  Edo: ["Benin City", "Auchi", "Ekpoma", "Uromi"],
  Ekiti: ["Ado Ekiti", "Ikere", "Omuo", "Ijero"],
  Enugu: ["Enugu", "Nsukka", "Agbani", "Oji River"],
  Gombe: ["Gombe", "Kaltungo", "Deba", "Billiri"],
  Imo: ["Owerri", "Orlu", "Okigwe", "Mbaise"],
  Jigawa: ["Dutse", "Hadejia", "Gumel", "Kazaure"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan", "Samaru"],
  Kano: ["Kano Municipal", "Fagge", "Dala", "Nassarawa"],
  Katsina: ["Katsina", "Daura", "Funtua", "Malumfashi"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"],
  Kogi: ["Lokoja", "Okene", "Anyigba", "Kabba"],
  Kwara: ["Ilorin", "Offa", "Omu-Aran", "Jebba"],
  Lagos: [
    "Ikeja",
    "Victoria Island",
    "Lekki",
    "Surulere",
    "Yaba",
    "Ajah",
    "Ikorodu",
    "Apapa",
    "Mushin",
    "Oshodi",
  ],
  Nasarawa: ["Lafia", "Keffi", "Akwanga", "Karu"],
  Niger: ["Minna", "Suleja", "Bida", "Kontagora"],
  Ogun: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ota"],
  Ondo: ["Akure", "Ondo", "Owo", "Ikare"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa", "Ede"],
  Oyo: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin"],
  Plateau: ["Jos", "Bukuru", "Pankshin", "Shendam"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Eleme", "Oyigbo"],
  Sokoto: ["Sokoto", "Tambuwal", "Wurno", "Gwadabawa"],
  Taraba: ["Jalingo", "Wukari", "Bali", "Takum"],
  Yobe: ["Damaturu", "Potiskum", "Gashua", "Nguru"],
  Zamfara: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka"],
  "Abuja (FCT)": ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Karu", "Lugbe"],
};

export const INDUSTRIES = [
  "Banking",
  "Engineering",
  "Technology",
  "Finance",
  "Consulting",
  "Education",
  "Healthcare",
  "Law",
  "Manufacturing",
  "Energy",
  "Oil and Gas",
  "Accounting",
  "Marketing",
  "NGO",
  "Teaching",
  "Telecommunications",
  "Public Sector",
  "Nonprofit",
] as const;

export const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "throwam.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "10minutemail.com",
  "maildrop.cc",
  "dispostable.com",
];

export const FREE_PREVIEW_LIMIT = 3;
export const PREVIEW_CANVAS_WIDTH = 600;

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior level" },
  { value: "executive", label: "Executive" },
] as const;

export const NYSC_STATUS_OPTIONS = [
  { value: "discharged", label: "Discharged" },
  { value: "exempted", label: "Exempted" },
  { value: "ongoing", label: "Ongoing" },
  { value: "not_yet", label: "Not yet served" },
] as const;

export const DEGREE_CLASS_OPTIONS = [
  { value: "first_class", label: "First Class" },
  { value: "second_class_upper", label: "Second Class Upper" },
  { value: "second_class_lower", label: "Second Class Lower" },
  { value: "third_class", label: "Third Class" },
  { value: "pass", label: "Pass" },
  { value: "distinction", label: "Distinction" },
  { value: "merit", label: "Merit" },
  { value: "credit", label: "Credit" },
  { value: "other", label: "Other" },
] as const;

export function createEducationEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: "",
    course: "",
    degreeClass: "other",
    year: "",
  };
}

export function createExperienceEntry(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    responsibilities: "",
  };
}

export function createCertificationEntry(): CertificationEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    issuer: "",
    year: "",
  };
}

export function createRefereeEntry(): RefereeEntry {
  return {
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
  };
}

export function createDefaultCVFormData(email = ""): CVFormData {
  return {
    fullName: "",
    phone: "",
    email,
    locationState: "",
    locationCity: "",
    dateOfBirth: "",
    industry: "",
    experienceLevel: "entry",
    nyscStatus: "not_yet",
    careerObjective: "",
    education: [createEducationEntry()],
    workExperience: [createExperienceEntry()],
    noExperienceYet: false,
    skills: [],
    certifications: [createCertificationEntry()],
    languages: [],
    aiEnhancedObjective: null,
    aiSuggestedSkills: [],
    aiEnhancementUpdatedAt: null,
    aiEnhancementSourceSignature: null,
    refereeOne: createRefereeEntry(),
    refereeTwo: createRefereeEntry(),
    furthestStepIndex: 0,
    lastSavedAt: null,
  };
}
