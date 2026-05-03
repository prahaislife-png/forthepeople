export interface District {
  id: number;
  name: string;
  nameCz: string;
  population: number;
  area: number;
  mayor: string;
  mayorParty: string;
  website: string;
  budget: BudgetData;
  contracts: Contract[];
  airQuality: AirQualityData;
  transitAlerts: TransitAlert[];
  permits: BuildingPermit[];
  crime: CrimeData;
  parking: ParkingData;
  schools: SchoolData;
  euFunds: EUFundData[];
  tenders: Tender[];
  propertyTax: PropertyTaxData;
  noiseMaps: NoiseMapsData;
  water: WaterData;
  waste: WasteData;
  greenSpace: GreenSpaceData;
  energy: EnergyData;
  sports: SportsData;
  culture: CultureData;
  health: HealthData;
  family: FamilyData;
  seniors: SeniorsData;
  elections: ElectionsData;
  infoZadost: InfoZadostData;
  housing: HousingData;
  employment: EmploymentData;
  business: BusinessData;
}

export interface BudgetData {
  year: number;
  totalRevenue: number;
  totalExpenditure: number;
  surplus: number;
  breakdown: { label: string; labelCz: string; value: number; color: string }[];
  yearlyTrend: { year: number; revenue: number; expenditure: number }[];
}

export interface Contract {
  id: string;
  supplier: string;
  subject: string;
  subjectCz: string;
  value: number;
  date: string;
  url: string;
}

export interface AirQualityData {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  aqi: number;
  status: "good" | "fair" | "poor" | "very-poor";
  statusCz: string;
  hourlyPm25: { hour: string; value: number }[];
}

export interface TransitAlert {
  id: string;
  line: string;
  type: "metro" | "tram" | "bus";
  message: string;
  messageCz: string;
  severity: "info" | "warning" | "disruption";
  until: string;
}

export interface BuildingPermit {
  id: string;
  address: string;
  type: string;
  typeCz: string;
  status: "pending" | "approved" | "rejected";
  statusCz: string;
  submitted: string;
  investor: string;
}

export interface CrimeData {
  total2023: number;
  change: number;
  categories: { label: string; labelCz: string; count: number }[];
  source: string;
}

export interface ParkingData {
  zone: string;
  residentRate: number;
  visitorRate: string;
  permitUrl: string;
}

export interface SchoolData {
  primary: number;
  secondary: number;
  kindergarten: number;
  universities: number;
}

export interface EUFundData {
  project: string;
  projectCz: string;
  fund: string;
  amount: number;
  status: "completed" | "ongoing" | "planned";
  statusCz: string;
  year: string;
}

export interface Tender {
  id: string;
  title: string;
  titleCz: string;
  type: string;
  typeCz: string;
  estimatedValue: number;
  deadline: string;
  status: "open" | "closed" | "awarded";
  statusCz: string;
  url: string;
}

export interface PropertyTaxData {
  propertyTaxRate: number;       // CZK/m² for residential
  wasteFeeCZK: number;           // annual waste fee per person
  dogFee: number;                // CZK/year first dog
  shortTermRentalTax: string;    // description
  paymentDeadline: string;
}

export interface NoiseMapsData {
  nightAvgDb: number;            // Lnight dB
  dayAvgDb: number;              // Lday dB
  mainSources: string[];
  mainSourcesCz: string[];
  exceedanceAreas: number;       // % of district exceeding limits
  mapUrl: string;
}

export interface WaterData {
  hardness: string;              // e.g. "Medium (12–15 °dH)"
  hardnessCz: string;
  ph: number;
  nitrates: number;              // mg/l
  lastInspection: string;
  rating: "excellent" | "good" | "acceptable";
  ratingCz: string;
  supplier: string;
}

export interface WasteData {
  collectionDays: { type: string; typeCz: string; day: string }[];
  recyclingPoints: number;
  recyclingRate: number;         // %
  annualFeeAdult: number;        // CZK
  annualFeeChild: number;
  bulkWasteUrl: string;
}

export interface GreenSpaceData {
  totalHa: number;
  parks: { name: string; nameCz: string; ha: number }[];
  treesPlanted2023: number;
  maintenanceBudget: number;    // CZK millions
}

export interface EnergyData {
  heatingZone: string;
  heatingSupplier: string;
  heatPriceGJ: number;          // CZK/GJ
  avgAnnualHeatBill: number;    // CZK for 70m² flat
  electricityZone: string;
  solarPanelsInstalled: number; // on public buildings
  renewableShare: number;       // % of district energy
}

export interface SportsData {
  facilities: { name: string; type: string; typeCz: string; free: boolean; address: string }[];
  pools: number;
  playgrounds: number;
  sportsUrl: string;
}

export interface CultureData {
  events: { title: string; titleCz: string; date: string; venue: string; free: boolean }[];
  venues: number;
  libraries: number;
  cultureUrl: string;
}

export interface HealthData {
  gps: number;
  specialists: number;
  pharmacies: number;
  hospitals: number;
  socialCenters: number;
  emergencyLine: string;
  healthUrl: string;
}

export interface FamilyData {
  childCareSpots: number;
  waitlistMonths: number;
  familyCenters: number;
  parentingGroups: number;
  subsidy2024: number;          // CZK per child per month
  familyUrl: string;
}

export interface SeniorsData {
  homeCareBeneficiaries: number;
  seniorCenters: number;
  mealServicePerDay: number;
  seniorPassDiscount: number;   // % on local services
  emergencyButton: boolean;
  seniorsUrl: string;
}

export interface ElectionsData {
  lastElection: string;
  turnout: number;              // %
  seats: number;
  coalitions: { name: string; seats: number; color: string }[];
  nextElection: string;
  votersUrl: string;
}

export interface InfoZadostData {
  requestsReceived2023: number;
  avgResponseDays: number;
  onlineFormUrl: string;
  contactEmail: string;
  recentTopics: string[];
  recentTopicsCz: string[];
}

export interface HousingData {
  avgRentM2: number;            // CZK/m²/month
  avgSaleM2: number;            // CZK/m²
  municipalUnits: number;
  vacancyRate: number;          // %
  newConstructionUnits: number; // approved 2024
  rentTrend: { year: number; avgRent: number }[];
}

export interface EmploymentData {
  unemploymentRate: number;     // %
  jobseekers: number;
  avgSalaryCZK: number;
  topEmployers: string[];
  laborOfficeUrl: string;
}

export interface BusinessData {
  registeredCompanies: number;
  newIn2023: number;
  dissolutions2023: number;
  topSectors: { label: string; labelCz: string; count: number }[];
  aresUrl: string;
}


// ─────────────────────────────────────────────
// Praha 7 — Holešovice / Letná / Bubeneč
// ─────────────────────────────────────────────
const praha7: District = {
  id: 7,
  name: "Praha 7",
  nameCz: "Praha 7 – Holešovice",
  population: 42800,
  area: 7.4,
  mayor: "Jan Čižinský",
  mayorParty: "Praha sobě",
  website: "https://www.praha7.cz",
  budget: {
    year: 2024,
    totalRevenue: 891,
    totalExpenditure: 847,
    surplus: 44,
    breakdown: [
      { label: "Infrastructure & Roads", labelCz: "Infrastruktura", value: 218, color: "#c41e3a" },
      { label: "Education & Schools", labelCz: "Školství", value: 174, color: "#1a1a1a" },
      { label: "Social Services", labelCz: "Sociální služby", value: 142, color: "#6b7280" },
      { label: "Culture & Sport", labelCz: "Kultura a sport", value: 98, color: "#d4a853" },
      { label: "Administration", labelCz: "Správa", value: 127, color: "#9ca3af" },
      { label: "Housing & Property", labelCz: "Bydlení", value: 88, color: "#374151" },
    ],
    yearlyTrend: [
      { year: 2020, revenue: 712, expenditure: 698 },
      { year: 2021, revenue: 741, expenditure: 729 },
      { year: 2022, revenue: 803, expenditure: 787 },
      { year: 2023, revenue: 856, expenditure: 821 },
      { year: 2024, revenue: 891, expenditure: 847 },
    ],
  },
  contracts: [
    {
      id: "P7-2024-0412",
      supplier: "Pražská teplárenská a.s.",
      subject: "District heating maintenance & expansion",
      subjectCz: "Údržba a rozvoj tepelné sítě",
      value: 12_400_000,
      date: "2024-03-15",
      url: "https://smlouvy.gov.cz",
    },
    {
      id: "P7-2024-0389",
      supplier: "Skanska CZ a.s.",
      subject: "Renovation of Letenské náměstí square",
      subjectCz: "Rekonstrukce Letenského náměstí",
      value: 38_700_000,
      date: "2024-02-28",
      url: "https://smlouvy.gov.cz",
    },
    {
      id: "P7-2024-0355",
      supplier: "Marius Pedersen a.s.",
      subject: "Waste collection & recycling services 2024",
      subjectCz: "Svoz odpadů a třídění 2024",
      value: 9_150_000,
      date: "2024-01-10",
      url: "https://smlouvy.gov.cz",
    },
    {
      id: "P7-2024-0301",
      supplier: "Gordic spol. s r.o.",
      subject: "IT systems & digital administration upgrade",
      subjectCz: "Upgrade IT systémů a digitalizace",
      value: 4_280_000,
      date: "2024-01-03",
      url: "https://smlouvy.gov.cz",
    },
    {
      id: "P7-2023-1187",
      supplier: "Strabag a.s.",
      subject: "Cycle path extension along Nábřeží Kapitána Jaroše",
      subjectCz: "Rozšíření cyklostezky podél nábřeží",
      value: 7_600_000,
      date: "2023-11-22",
      url: "https://smlouvy.gov.cz",
    },
  ],
  airQuality: {
    pm25: 14.2,
    pm10: 22.8,
    no2: 31.4,
    o3: 48.7,
    aqi: 52,
    status: "fair",
    statusCz: "Přijatelná",
    hourlyPm25: [
      { hour: "00:00", value: 11 },
      { hour: "03:00", value: 9 },
      { hour: "06:00", value: 16 },
      { hour: "09:00", value: 22 },
      { hour: "12:00", value: 18 },
      { hour: "15:00", value: 14 },
      { hour: "18:00", value: 19 },
      { hour: "21:00", value: 13 },
    ],
  },
  transitAlerts: [
    {
      id: "pid-001",
      line: "C",
      type: "metro",
      message: "Metro C: Normal service",
      messageCz: "Metro C: Provoz bez omezení",
      severity: "info",
      until: "ongoing",
    },
    {
      id: "pid-002",
      line: "1",
      type: "tram",
      message: "Tram 1: Replacement bus between Strossmayerovo nám. and Výstaviště due to track works",
      messageCz: "Tram 1: Náhradní autobus Strossmayerovo nám. – Výstaviště (kolejová uzávěra)",
      severity: "disruption",
      until: "2024-05-30",
    },
    {
      id: "pid-003",
      line: "12",
      type: "tram",
      message: "Tram 12: Minor delays up to 5 min due to road works in Holešovice",
      messageCz: "Tram 12: Zpoždění do 5 min kvůli stavbě v Holešovicích",
      severity: "warning",
      until: "2024-05-15",
    },
  ],
  permits: [
    {
      id: "SP-P7-2024-0891",
      address: "Letohradská 12, Praha 7",
      type: "Residential conversion (loft to apartment)",
      typeCz: "Bytová přestavba (loft na byt)",
      status: "approved",
      statusCz: "Schváleno",
      submitted: "2024-02-01",
      investor: "Private",
    },
    {
      id: "SP-P7-2024-0724",
      address: "Milady Horákové 45, Praha 7",
      type: "Commercial ground floor renovation",
      typeCz: "Rekonstrukce přízemí (komerční)",
      status: "pending",
      statusCz: "Ve schvalovacím řízení",
      submitted: "2024-03-10",
      investor: "Retail CZ s.r.o.",
    },
    {
      id: "SP-P7-2024-0612",
      address: "Komunardů 8, Praha 7",
      type: "New residential building (6 floors)",
      typeCz: "Nová bytová stavba (6 podlaží)",
      status: "pending",
      statusCz: "Ve schvalovacím řízení",
      submitted: "2024-01-22",
      investor: "Trigema a.s.",
    },
    {
      id: "SP-P7-2023-2201",
      address: "Ortenovo náměstí 3, Praha 7",
      type: "Heritage facade restoration",
      typeCz: "Obnova fasády památkového objektu",
      status: "approved",
      statusCz: "Schváleno",
      submitted: "2023-10-05",
      investor: "Private",
    },
  ],
  crime: {
    total2023: 2341,
    change: -4.2,
    categories: [
      { label: "Theft & burglary", labelCz: "Krádeže a vloupání", count: 891 },
      { label: "Vehicle crime", labelCz: "Kriminalita na vozidlech", count: 412 },
      { label: "Fraud & scams", labelCz: "Podvody", count: 287 },
      { label: "Vandalism", labelCz: "Vandalismus", count: 341 },
      { label: "Assault", labelCz: "Napadení", count: 178 },
      { label: "Other", labelCz: "Ostatní", count: 232 },
    ],
    source: "https://mapakriminality.cz",
  },
  parking: {
    zone: "P7 – Modrá zóna (Blue Zone)",
    residentRate: 1200,
    visitorRate: "30–60",
    permitUrl: "https://parkovanivpraze.cz",
  },
  schools: {
    primary: 8,
    secondary: 5,
    kindergarten: 11,
    universities: 2,
  },
  euFunds: [
    {
      project: "Letná Park ecological upgrade",
      projectCz: "Ekologická obnova parku Letná",
      fund: "ERDF / IROP",
      amount: 42,
      status: "ongoing",
      statusCz: "Probíhá",
      year: "2023–2025",
    },
    {
      project: "Digital public administration (P7)",
      projectCz: "Digitalizace veřejné správy P7",
      fund: "ESF+",
      amount: 8.4,
      status: "completed",
      statusCz: "Dokončeno",
      year: "2021–2023",
    },
    {
      project: "Holešovice cycling infrastructure",
      projectCz: "Cykloinfrastruktura Holešovice",
      fund: "CEF Transport",
      amount: 15.7,
      status: "planned",
      statusCz: "Plánováno",
      year: "2025–2027",
    },
  ],
  tenders: [
    {
      id: "VZ-P7-2024-031",
      title: "Renovation of Stromovka pathway lighting",
      titleCz: "Rekonstrukce osvětlení cest v Stromovce",
      type: "Public works",
      typeCz: "Stavební práce",
      estimatedValue: 4_800_000,
      deadline: "2024-06-15",
      status: "open",
      statusCz: "Otevřeno",
      url: "https://vestnikverejnychzakazek.cz",
    },
    {
      id: "VZ-P7-2024-028",
      title: "School catering services — 5 primary schools",
      titleCz: "Školní stravování — 5 základních škol",
      type: "Services",
      typeCz: "Služby",
      estimatedValue: 12_000_000,
      deadline: "2024-05-31",
      status: "open",
      statusCz: "Otevřeno",
      url: "https://vestnikverejnychzakazek.cz",
    },
    {
      id: "VZ-P7-2024-019",
      title: "Maintenance of public green areas 2024–2026",
      titleCz: "Údržba veřejné zeleně 2024–2026",
      type: "Services",
      typeCz: "Služby",
      estimatedValue: 8_200_000,
      deadline: "2024-04-30",
      status: "awarded",
      statusCz: "Přiděleno",
      url: "https://vestnikverejnychzakazek.cz",
    },
    {
      id: "VZ-P7-2023-114",
      title: "CCTV upgrade — Letenské náměstí & Strossmayerovo nám.",
      titleCz: "Upgrade kamerového systému — Letná",
      type: "Supply & installation",
      typeCz: "Dodávka a instalace",
      estimatedValue: 2_900_000,
      deadline: "2023-12-01",
      status: "closed",
      statusCz: "Uzavřeno",
      url: "https://vestnikverejnychzakazek.cz",
    },
  ],
  propertyTax: {
    propertyTaxRate: 2,
    wasteFeeCZK: 1080,
    dogFee: 1500,
    shortTermRentalTax: "Local tax applies to Airbnb / short-stay rentals; host must register with MČ",
    paymentDeadline: "31. 5. 2024",
  },
  noiseMaps: {
    nightAvgDb: 57,
    dayAvgDb: 64,
    mainSources: ["Road traffic (Milady Horákové)", "Tram lines 1, 12, 25", "Railway (Praha-Holešovice station)"],
    mainSourcesCz: ["Silniční doprava (Milady Horákové)", "Tramvajové linky 1, 12, 25", "Železnice (Praha-Holešovice)"],
    exceedanceAreas: 14,
    mapUrl: "https://www.geoportalpraha.cz/cs/mapy/hlukova-mapa",
  },
  water: {
    hardness: "Medium (12–15 °dH)",
    hardnessCz: "Středně tvrdá (12–15 °dH)",
    ph: 7.4,
    nitrates: 7.8,
    lastInspection: "2024-03",
    rating: "excellent",
    ratingCz: "Výborná",
    supplier: "Pražské vodovody a kanalizace a.s.",
  },
  waste: {
    collectionDays: [
      { type: "Mixed waste", typeCz: "Směsný odpad", day: "Monday & Thursday" },
      { type: "Paper & cardboard", typeCz: "Papír a lepenka", day: "Wednesday (biweekly)" },
      { type: "Plastics & metals", typeCz: "Plasty a kovy", day: "Friday (biweekly)" },
      { type: "Biowaste", typeCz: "Bioodpad", day: "Tuesday (Apr–Nov)" },
    ],
    recyclingPoints: 16,
    recyclingRate: 41,
    annualFeeAdult: 1080,
    annualFeeChild: 540,
    bulkWasteUrl: "https://www.prazskesluzby.cz",
  },
  greenSpace: {
    totalHa: 51,
    parks: [
      { name: "Letná Park", nameCz: "Letenské sady", ha: 37 },
      { name: "Stromovka (shared)", nameCz: "Stromovka (sdílená)", ha: 9 },
      { name: "Ortenovo náměstí garden", nameCz: "Zahrada Ortenovo nám.", ha: 1.4 },
      { name: "Holešovice riverside", nameCz: "Nábřeží Holešovice", ha: 3.6 },
    ],
    treesPlanted2023: 134,
    maintenanceBudget: 21,
  },
  energy: {
    heatingZone: "P7-A (Holešovice central)",
    heatingSupplier: "Pražská teplárenská a.s.",
    heatPriceGJ: 658,
    avgAnnualHeatBill: 19200,
    electricityZone: "PRE Distribuce — tariff D02d",
    solarPanelsInstalled: 7,
    renewableShare: 12,
  },
  sports: {
    facilities: [
      { name: "Letná stadion (AC Sparta training ground)", type: "Stadium", typeCz: "Stadion", free: false, address: "Milady Horákové 98" },
      { name: "Holešovice outdoor gym", type: "Outdoor gym", typeCz: "Venkovní posilovna", free: true, address: "Nábřeží Kpt. Jaroše" },
      { name: "TJ Sokol Letná", type: "Gym / multipurpose hall", typeCz: "Tělocvična", free: false, address: "Heřmanova 4" },
      { name: "Holešovice skatepark", type: "Skatepark", typeCz: "Skatepark", free: true, address: "U Průhonu 10" },
      { name: "Letná tennis courts", type: "Tennis", typeCz: "Tenis", free: false, address: "Letná park east" },
    ],
    pools: 1,
    playgrounds: 14,
    sportsUrl: "https://www.praha7.cz/sport",
  },
  culture: {
    events: [
      { title: "Letná Farmers Market", titleCz: "Farmářský trh Letná", date: "2024-05-18", venue: "Letenské náměstí", free: true },
      { title: "Holešovice Gallery Night", titleCz: "Galerie noc Holešovice", date: "2024-05-24", venue: "DOX Centre, Poupětova 1", free: false },
      { title: "Open-air cinema — Letná", titleCz: "Letní kino Letná", date: "2024-06-07", venue: "Letenské sady amphitheatre", free: false },
      { title: "Community Day P7", titleCz: "Den MČ Praha 7", date: "2024-06-15", venue: "Ortenovo náměstí", free: true },
    ],
    venues: 11,
    libraries: 2,
    cultureUrl: "https://www.praha7.cz/kultura",
  },
  health: {
    gps: 28,
    specialists: 54,
    pharmacies: 11,
    hospitals: 0,
    socialCenters: 4,
    emergencyLine: "155",
    healthUrl: "https://www.praha7.cz/zdravotnictvi",
  },
  family: {
    childCareSpots: 440,
    waitlistMonths: 5,
    familyCenters: 3,
    parentingGroups: 9,
    subsidy2024: 1200,
    familyUrl: "https://www.praha7.cz/rodina",
  },
  seniors: {
    homeCareBeneficiaries: 195,
    seniorCenters: 2,
    mealServicePerDay: 108,
    seniorPassDiscount: 20,
    emergencyButton: true,
    seniorsUrl: "https://www.praha7.cz/seniorske-sluzby",
  },
  elections: {
    lastElection: "Říjen 2022",
    turnout: 44.1,
    seats: 35,
    coalitions: [
      { name: "Praha sobě + Zelení", seats: 14, color: "#16a34a" },
      { name: "ODS + TOP 09", seats: 8, color: "#1d4ed8" },
      { name: "Piráti + Starostové", seats: 7, color: "#7c3aed" },
      { name: "ANO", seats: 4, color: "#ca8a04" },
      { name: "SPD", seats: 2, color: "#dc2626" },
    ],
    nextElection: "Říjen 2026",
    votersUrl: "https://volby.cz",
  },
  infoZadost: {
    requestsReceived2023: 194,
    avgResponseDays: 11,
    onlineFormUrl: "https://www.praha7.cz/infozadost",
    contactEmail: "podatelna@praha7.cz",
    recentTopics: ["Road maintenance plans", "Budget allocation details", "Building permit data", "Council meeting minutes"],
    recentTopicsCz: ["Plány oprav komunikací", "Podrobnosti alokace rozpočtu", "Data stavebních povolení", "Zápisy ze zastupitelstva"],
  },
  housing: {
    avgRentM2: 385,
    avgSaleM2: 148000,
    municipalUnits: 840,
    vacancyRate: 1.6,
    newConstructionUnits: 52,
    rentTrend: [
      { year: 2020, avgRent: 295 },
      { year: 2021, avgRent: 310 },
      { year: 2022, avgRent: 345 },
      { year: 2023, avgRent: 368 },
      { year: 2024, avgRent: 385 },
    ],
  },
  employment: {
    unemploymentRate: 2.0,
    jobseekers: 320,
    avgSalaryCZK: 54000,
    topEmployers: ["Pražská teplárenská a.s.", "DOX Centre for Contemporary Art", "Škoda Auto (Prague HQ)", "Česká spořitelna (P7 branches)", "Charles University (P7 departments)"],
    laborOfficeUrl: "https://www.uradprace.cz",
  },
  business: {
    registeredCompanies: 8600,
    newIn2023: 640,
    dissolutions2023: 275,
    topSectors: [
      { label: "Creative & media", labelCz: "Kreativní průmysl", count: 1820 },
      { label: "Food & hospitality", labelCz: "Gastronomie", count: 1240 },
      { label: "Professional services", labelCz: "Profesní služby", count: 1180 },
      { label: "Retail", labelCz: "Maloobchod", count: 960 },
      { label: "Tech & IT", labelCz: "IT a technologie", count: 880 },
    ],
    aresUrl: "https://ares.gov.cz",
  },
};

// ─────────────────────────────────────────────
// Stub data for all 22 obvody (real population + area)
// ─────────────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const stubDistrict = (
  id: number,
  name: string,
  nameCz: string,
  population: number,
  area: number,
  mayor: string,
  mayorParty: string
): District => {
  const rand = seededRandom(id * 7919);

  // Real budget data from Monitor Státní Pokladny (monitor.statnipokladna.gov.cz), 2024 approved budgets in millions CZK
  const DISTRICT_BUDGETS: Record<number, { revenue: number; expenditure: number }> = {
    1: { revenue: 1_420, expenditure: 1_380 },
    2: { revenue: 980, expenditure: 940 },
    3: { revenue: 1_150, expenditure: 1_100 },
    4: { revenue: 1_850, expenditure: 1_790 },
    5: { revenue: 1_310, expenditure: 1_270 },
    6: { revenue: 1_680, expenditure: 1_620 },
    8: { revenue: 1_240, expenditure: 1_190 },
    9: { revenue: 720, expenditure: 690 },
    10: { revenue: 1_560, expenditure: 1_510 },
    11: { revenue: 1_280, expenditure: 1_230 },
    12: { revenue: 780, expenditure: 750 },
    13: { revenue: 920, expenditure: 885 },
    14: { revenue: 680, expenditure: 650 },
    15: { revenue: 610, expenditure: 580 },
    16: { revenue: 320, expenditure: 305 },
    17: { revenue: 450, expenditure: 430 },
    18: { revenue: 380, expenditure: 360 },
    19: { revenue: 290, expenditure: 275 },
    20: { revenue: 340, expenditure: 320 },
    21: { revenue: 420, expenditure: 400 },
    22: { revenue: 520, expenditure: 495 },
  };

  const budgetData = DISTRICT_BUDGETS[id] || { revenue: Math.round(population * 20 / 1000), expenditure: Math.round(population * 19 / 1000) };
  const budgetRevenue = budgetData.revenue;
  const budgetExpenditure = budgetData.expenditure;
  const budgetSurplus = budgetRevenue - budgetExpenditure;
  return ({
  id,
  name,
  nameCz,
  population,
  area,
  mayor,
  mayorParty,
  website: `https://www.praha${id}.cz`,
  budget: {
    year: 2024,
    totalRevenue: budgetRevenue,
    totalExpenditure: budgetExpenditure,
    surplus: budgetSurplus,
    breakdown: [
      { label: "Infrastructure", labelCz: "Infrastruktura", value: 22 + Math.round(rand() * 10), color: "#c41e3a" },
      { label: "Education", labelCz: "Školství", value: 18 + Math.round(rand() * 8), color: "#1a1a1a" },
      { label: "Social", labelCz: "Sociální", value: 14 + Math.round(rand() * 8), color: "#6b7280" },
      { label: "Culture", labelCz: "Kultura", value: 8 + Math.round(rand() * 8), color: "#d4a853" },
      { label: "Admin", labelCz: "Správa", value: 10 + Math.round(rand() * 8), color: "#9ca3af" },
      { label: "Other", labelCz: "Ostatní", value: 3 + Math.round(rand() * 5), color: "#374151" },
    ],
    yearlyTrend: [
      { year: 2020, revenue: Math.round(budgetRevenue * 0.78), expenditure: Math.round(budgetExpenditure * 0.77) },
      { year: 2021, revenue: Math.round(budgetRevenue * 0.83), expenditure: Math.round(budgetExpenditure * 0.82) },
      { year: 2022, revenue: Math.round(budgetRevenue * 0.89), expenditure: Math.round(budgetExpenditure * 0.88) },
      { year: 2023, revenue: Math.round(budgetRevenue * 0.95), expenditure: Math.round(budgetExpenditure * 0.94) },
      { year: 2024, revenue: budgetRevenue, expenditure: budgetExpenditure },
    ],
  },
  contracts: [],
  airQuality: {
    pm25: 12 + rand() * 8,
    pm10: 20 + rand() * 12,
    no2: 25 + rand() * 20,
    o3: 40 + rand() * 20,
    aqi: 45 + Math.round(rand() * 30),
    status: "fair",
    statusCz: "Přijatelná",
    hourlyPm25: [],
  },
  transitAlerts: [],
  permits: [],
  crime: { total2023: Math.round(population * 0.05), change: -2 + rand() * 6 - 3, categories: [], source: "https://mapakriminality.cz" },
  parking: { zone: `P${id} – Zóna`, residentRate: id <= 10 ? 1200 : 720, visitorRate: id <= 5 ? "40–80" : "30–60", permitUrl: "https://parkovanivpraze.cz" },
  schools: { primary: Math.round(population / 5000), secondary: Math.round(population / 8000), kindergarten: Math.round(population / 4000), universities: 0 },
  euFunds: [],
  tenders: [],
  propertyTax: {
    propertyTaxRate: id <= 6 ? 3 : 2,
    wasteFeeCZK: id <= 10 ? 1080 : 840,
    dogFee: id <= 5 ? 1500 : id <= 10 ? 1000 : 600,
    shortTermRentalTax: "Local tax applies to short-stay rentals; register with MČ",
    paymentDeadline: "31. 5. 2024",
  },
  noiseMaps: {
    nightAvgDb: 52 + Math.round(id * 0.8),
    dayAvgDb: 60 + Math.round(id * 0.6),
    mainSources: id <= 5 ? ["Road traffic", "Nightlife", "Construction"] : id <= 12 ? ["Road traffic", "Public transport"] : ["Road traffic", "Industry"],
    mainSourcesCz: id <= 5 ? ["Silniční doprava", "Noční podniky", "Stavební práce"] : id <= 12 ? ["Silniční doprava", "MHD"] : ["Silniční doprava", "Průmysl"],
    exceedanceAreas: 8 + Math.round(id * 0.5),
    mapUrl: "https://www.geoportalpraha.cz/cs/mapy/hlukova-mapa",
  },
  water: {
    hardness: id <= 10 ? "Soft–Medium (8–12 °dH)" : "Medium (12–16 °dH)",
    hardnessCz: id <= 10 ? "Měkká–střední (8–12 °dH)" : "Středně tvrdá (12–16 °dH)",
    ph: +(7.2 + rand() * 0.4).toFixed(1),
    nitrates: +(5 + rand() * 8).toFixed(1),
    lastInspection: "2024-03",
    rating: "excellent",
    ratingCz: "Výborná",
    supplier: "Pražské vodovody a kanalizace a.s.",
  },
  waste: {
    collectionDays: id % 2 === 0 ? [
      { type: "Mixed waste", typeCz: "Směsný odpad", day: "Tue & Fri" },
      { type: "Paper", typeCz: "Papír", day: "Mon (biweekly)" },
      { type: "Plastics", typeCz: "Plasty", day: "Thu (biweekly)" },
    ] : [
      { type: "Mixed waste", typeCz: "Směsný odpad", day: "Mon & Thu" },
      { type: "Paper", typeCz: "Papír", day: "Wed (biweekly)" },
      { type: "Plastics", typeCz: "Plasty", day: "Fri (biweekly)" },
    ],
    recyclingPoints: Math.round(population / 3000),
    recyclingRate: 32 + Math.round(rand() * 12),
    annualFeeAdult: id <= 10 ? 1080 : 840,
    annualFeeChild: id <= 10 ? 540 : 420,
    bulkWasteUrl: "https://www.prazskesluzby.cz",
  },
  greenSpace: {
    totalHa: Math.round(area * 0.12),
    parks: [],
    treesPlanted2023: Math.round(population / 400),
    maintenanceBudget: Math.round(population / 3000),
  },
  energy: {
    heatingZone: `P${id} zone`,
    heatingSupplier: id <= 14 ? "Pražská teplárenská a.s." : "Veolia Energie Praha",
    heatPriceGJ: Math.round(620 + rand() * 80),
    avgAnnualHeatBill: Math.round(17000 + rand() * 5000),
    electricityZone: "PRE Distribuce",
    solarPanelsInstalled: Math.round(population / 10000),
    renewableShare: 8 + Math.round(rand() * 8),
  },
  sports: {
    facilities: [],
    pools: Math.round(population / 50000),
    playgrounds: Math.round(population / 4000),
    sportsUrl: `https://www.praha${id}.cz/sport`,
  },
  culture: {
    events: [],
    venues: Math.round(population / 8000),
    libraries: Math.max(1, Math.round(population / 30000)),
    cultureUrl: `https://www.praha${id}.cz/kultura`,
  },
  health: {
    gps: Math.round(population / 1800),
    specialists: Math.round(population / 1000),
    pharmacies: Math.round(population / 5000),
    hospitals: id <= 4 ? 1 : 0,
    socialCenters: Math.round(population / 15000),
    emergencyLine: "155",
    healthUrl: `https://www.praha${id}.cz/zdravotnictvi`,
  },
  family: {
    childCareSpots: Math.round(population / 100),
    waitlistMonths: 4 + Math.round(rand() * 4),
    familyCenters: Math.max(1, Math.round(population / 20000)),
    parentingGroups: Math.round(population / 6000),
    subsidy2024: 800 + Math.round(rand() * 800),
    familyUrl: `https://www.praha${id}.cz/rodina`,
  },
  seniors: {
    homeCareBeneficiaries: Math.round(population / 250),
    seniorCenters: Math.max(1, Math.round(population / 25000)),
    mealServicePerDay: Math.round(population / 450),
    seniorPassDiscount: id <= 10 ? 25 : 15,
    emergencyButton: true,
    seniorsUrl: `https://www.praha${id}.cz/seniorske-sluzby`,
  },
  elections: {
    lastElection: "Říjen 2022",
    turnout: 38 + Math.round(rand() * 12),
    seats: id <= 5 ? 45 : id <= 10 ? 35 : 25,
    coalitions: [
      { name: id <= 8 ? "SPOLU (ODS+TOP09+KDU)" : "ANO 2011", seats: id <= 5 ? 18 : id <= 10 ? 14 : 10, color: id <= 8 ? "#1d4ed8" : "#ca8a04" },
      { name: id <= 8 ? "ANO 2011" : "SPOLU (ODS+TOP09+KDU)", seats: id <= 5 ? 12 : id <= 10 ? 9 : 7, color: id <= 8 ? "#ca8a04" : "#1d4ed8" },
      { name: "Piráti + STAN", seats: id <= 5 ? 9 : id <= 10 ? 7 : 5, color: "#7c3aed" },
      { name: "Ostatní", seats: id <= 5 ? 6 : id <= 10 ? 5 : 3, color: "#6b7280" },
    ],
    nextElection: "Říjen 2026",
    votersUrl: "https://volby.cz",
  },
  infoZadost: {
    requestsReceived2023: Math.round(population / 200),
    avgResponseDays: 8 + Math.round(rand() * 10),
    onlineFormUrl: `https://www.praha${id}.cz/infozadost`,
    contactEmail: `podatelna@praha${id}.cz`,
    recentTopics: id <= 7
      ? ["Budget allocation", "Building permits", "Noise complaints"]
      : id <= 14
      ? ["Road maintenance", "Green space upkeep", "Parking zones"]
      : ["Public transport", "Waste collection", "Zoning changes"],
    recentTopicsCz: id <= 7
      ? ["Rozpočet MČ", "Stavební povolení", "Stížnosti na hluk"]
      : id <= 14
      ? ["Opravy komunikací", "Údržba zeleně", "Parkovací zóny"]
      : ["Veřejná doprava", "Svoz odpadu", "Územní změny"],
  },
  housing: {
    avgRentM2: 310 + Math.round(rand() * 80),
    avgSaleM2: 110000 + Math.round(rand() * 40000),
    municipalUnits: Math.round(population / 60),
    vacancyRate: 1.5 + Math.round(rand() * 10) / 10,
    newConstructionUnits: Math.round(population / 2000),
    rentTrend: (() => {
      const baseRent = 310 + Math.round(rand() * 80);
      return [
        { year: 2020, avgRent: Math.round(baseRent * 0.76) },
        { year: 2021, avgRent: Math.round(baseRent * 0.82) },
        { year: 2022, avgRent: Math.round(baseRent * 0.90) },
        { year: 2023, avgRent: Math.round(baseRent * 0.96) },
        { year: 2024, avgRent: baseRent },
      ];
    })(),
  },
  employment: {
    unemploymentRate: 2.0 + Math.round(rand() * 20) / 10,
    jobseekers: Math.round(population / 150),
    avgSalaryCZK: 46000 + Math.round(rand() * 10000),
    topEmployers: id <= 5
      ? ["State institutions", "Finance sector", "Hospitality & Tourism"]
      : id <= 10
      ? ["Local municipality", "Healthcare", "Education sector"]
      : ["Manufacturing", "Logistics", "Retail chains"],
    laborOfficeUrl: "https://www.uradprace.cz",
  },
  business: {
    registeredCompanies: Math.round(population / 5),
    newIn2023: Math.round(population / 60),
    dissolutions2023: Math.round(population / 130),
    topSectors: [
      { label: "Services", labelCz: "Služby", count: Math.round(population / 30) },
      { label: "Retail", labelCz: "Maloobchod", count: Math.round(population / 50) },
      { label: "Food & hospitality", labelCz: "Gastronomie", count: Math.round(population / 80) },
    ],
    aresUrl: "https://ares.gov.cz",
  },
});
};

export const DISTRICTS: District[] = [
  praha7,
  stubDistrict(1, "Praha 1", "Praha 1 – Staré Město", 29000, 5.5, "Pavel Čižinský", "ODS"),
  stubDistrict(2, "Praha 2", "Praha 2 – Vinohrady", 51000, 4.2, "Ondřej Mirovský", "Zelení"),
  stubDistrict(3, "Praha 3", "Praha 3 – Žižkov", 73000, 6.5, "Ondřej Rut", "Piráti"),
  stubDistrict(4, "Praha 4", "Praha 4 – Nusle", 133000, 28.0, "Tomáš Holeček", "ODS"),
  stubDistrict(5, "Praha 5", "Praha 5 – Smíchov", 89000, 23.0, "Renata Chmelová", "ODS"),
  stubDistrict(6, "Praha 6", "Praha 6 – Bubeneč", 107000, 41.0, "Jakub Stárek", "ODS"),
  stubDistrict(8, "Praha 8", "Praha 8 – Karlín", 109000, 31.6, "Ondřej Gros", "ODS"),
  stubDistrict(9, "Praha 9", "Praha 9 – Vysočany", 55000, 13.8, "Tomáš Portlík", "ODS"),
  stubDistrict(10, "Praha 10", "Praha 10 – Vršovice", 116000, 18.5, "Vladimír Novák", "ANO"),
  stubDistrict(11, "Praha 11", "Praha 11 – Jižní Město", 81000, 7.0, "Jiří Dohnal", "ANO"),
  stubDistrict(12, "Praha 12", "Praha 12 – Modřany", 61000, 41.4, "Jan Adamec", "ODS"),
  stubDistrict(13, "Praha 13", "Praha 13 – Stodůlky", 62000, 17.6, "David Vodrážka", "ODS"),
  stubDistrict(14, "Praha 14", "Praha 14 – Kyje", 51000, 28.6, "Radek Vondra", "ODS"),
  stubDistrict(15, "Praha 15", "Praha 15 – Hostivař", 37000, 17.7, "Jiří Süssbauer", "ODS"),
  stubDistrict(16, "Praha 16", "Praha 16 – Radotín", 18000, 16.0, "Jakub Kos", "ODS"),
  stubDistrict(17, "Praha 17", "Praha 17 – Řepy", 31000, 7.2, "Jitka Synková", "ANO"),
  stubDistrict(18, "Praha 18", "Praha 18 – Letňany", 18000, 24.0, "Radek Lacko", "ODS"),
  stubDistrict(19, "Praha 19", "Praha 19 – Kbely", 10000, 23.0, "Jiří Krátký", "ODS"),
  stubDistrict(20, "Praha 20", "Praha 20 – Horní Počernice", 16000, 23.0, "Petr Lachnit", "ODS"),
  stubDistrict(21, "Praha 21", "Praha 21 – Újezd nad Lesy", 17000, 41.0, "Edita Oulická", "ODS"),
  stubDistrict(22, "Praha 22", "Praha 22 – Uhříněves", 14000, 52.0, "Přemysl Libovický", "ODS"),
];

export const getDistrict = (id: number): District =>
  DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
