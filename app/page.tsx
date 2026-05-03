"use client";

import { useState, useEffect, useMemo } from "react";
import { DISTRICTS, getDistrict } from "./data/districts";
import { useBulkData, usePrefetch, extractSection, timeAgo, fmtCZK, type LiveState } from "./hooks/useLiveData";
import {
  Heart, Train, Wallet, Shield, Vote, Home, Briefcase, GraduationCap,
  FileText, Zap, Droplets, Users, Volume2, Landmark, Building2, Car,
  Bike, DollarSign, Globe, HandHeart, Baby, Palette, Map, Wifi,
  CalendarDays, FileSearch, Leaf, Recycle, BookOpen, Expand, Search,
  BarChart3, GitCompare, Sun, Moon, Clock, Share2, Compass, ChevronRight, Plug, Lock, Bell, TrendingUp, type LucideIcon
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useTheme } from "./hooks/useTheme";
import { computeLivabilityScore } from "./hooks/useLivabilityScore";
import { getTrendForTile } from "./hooks/useTrendData";
import { useParallax } from "./hooks/useAnimations";
import { DistrictSummary } from "@/components/DistrictSummary";
import { TrendArrow } from "@/components/TrendArrow";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ShareCardDialog } from "@/components/ShareCardDialog";
import { DistrictWizard } from "@/components/DistrictWizard";
import { TiltCard } from "@/components/TiltCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { PragueMap } from "@/components/PragueMap";
import { PragueSkylineLoader } from "@/components/PragueSkylineLoader";
import { getSavedOrder, saveTileOrder } from "./hooks/useDragReorder";
import { useSubscription } from "./hooks/useSubscription";
import { ChatWidget } from "@/components/ChatWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/app/i18n/I18nProvider";
import { trackEvent } from "@/app/lib/analytics";
import Link from "next/link";

// --- Section Configuration ---
interface SectionConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  tiles: string[];
}

const SECTIONS: SectionConfig[] = [
  { id: "gov", title: "Government & Transparency", icon: Landmark, tiles: ["cityhall", "elections", "contracts", "tenders", "budget", "eufunds", "permits", "crimemap"] },
  { id: "infra", title: "Infrastructure & Utilities", icon: Zap, tiles: ["energy", "water", "waste", "noise", "noisesensors", "internet", "parking", "cycling", "transit", "evcharging"] },
  { id: "community", title: "Community & Social", icon: Users, tiles: ["health", "social", "childcare", "education", "schoolrankings", "libraries", "sports", "demographics", "foreigners"] },
  { id: "economy", title: "Economy & Work", icon: Briefcase, tiles: ["employment", "business", "exchange", "coworking"] },
  { id: "living", title: "Living & Culture", icon: Home, tiles: ["housing", "culture", "parks", "tourism", "holidays"] },
  { id: "env", title: "Environment", icon: Leaf, tiles: ["weather", "air"] },
];

const TILE_META: Record<string, { title: string; icon: LucideIcon; keywords: string[] }> = {
  contracts: { title: "Public Contracts", icon: FileSearch, keywords: ["contracts", "procurement", "tenders"] },
  health: { title: "Healthcare", icon: Heart, keywords: ["health", "hospital", "pharmacy", "doctor"] },
  transit: { title: "Transit", icon: Train, keywords: ["transit", "metro", "tram", "bus", "transport"] },
  waste: { title: "Waste & Recycling", icon: Recycle, keywords: ["waste", "recycling", "containers", "trash"] },
  parks: { title: "Parks", icon: Leaf, keywords: ["parks", "green", "garden", "nature"] },
  sports: { title: "Sports", icon: Bike, keywords: ["sports", "playground", "gym", "fitness"] },
  libraries: { title: "Libraries", icon: BookOpen, keywords: ["library", "books", "reading"] },
  business: { title: "Business Registry", icon: Briefcase, keywords: ["business", "company", "ICO"] },
  cityhall: { title: "City Hall", icon: Landmark, keywords: ["city hall", "municipal", "office"] },
  budget: { title: "Budget", icon: Wallet, keywords: ["budget", "revenue", "expenditure", "finance"] },
  crime: { title: "Crime", icon: Shield, keywords: ["crime", "safety", "police", "incidents"] },
  elections: { title: "Elections", icon: Vote, keywords: ["elections", "voting", "parties", "turnout"] },
  housing: { title: "Housing", icon: Home, keywords: ["housing", "rent", "real estate", "property"] },
  employment: { title: "Employment", icon: Briefcase, keywords: ["employment", "jobs", "salary", "unemployment"] },
  education: { title: "Education", icon: GraduationCap, keywords: ["education", "schools", "kindergarten", "university"] },
  tenders: { title: "Tenders", icon: FileText, keywords: ["tenders", "procurement", "bidding"] },
  energy: { title: "Energy", icon: Zap, keywords: ["energy", "electricity", "heat", "gas", "renewable"] },
  water: { title: "Water Quality", icon: Droplets, keywords: ["water", "quality", "drinking", "pH"] },
  demographics: { title: "Demographics", icon: Users, keywords: ["demographics", "population", "density"] },
  noise: { title: "Noise Pollution", icon: Volume2, keywords: ["noise", "pollution", "decibel", "sound"] },
  eufunds: { title: "EU Funds", icon: Globe, keywords: ["EU", "funds", "grants", "projects"] },
  permits: { title: "Building Permits", icon: Building2, keywords: ["permits", "building", "construction"] },
  parking: { title: "Parking", icon: Car, keywords: ["parking", "P+R", "spaces", "garage"] },
  cycling: { title: "Cycling", icon: Bike, keywords: ["cycling", "bike", "bicycle", "counter"] },
  exchange: { title: "Exchange Rates", icon: DollarSign, keywords: ["exchange", "currency", "EUR", "USD", "CZK"] },
  foreigners: { title: "Foreigners", icon: Globe, keywords: ["foreigners", "expats", "immigration", "nationality"] },
  social: { title: "Social Services", icon: HandHeart, keywords: ["social", "services", "elderly", "shelter"] },
  childcare: { title: "Childcare", icon: Baby, keywords: ["childcare", "kindergarten", "nursery", "children"] },
  culture: { title: "Culture & Arts", icon: Palette, keywords: ["culture", "theater", "gallery", "cinema", "arts"] },
  tourism: { title: "Tourism", icon: Map, keywords: ["tourism", "visitors", "hotels", "Airbnb", "attractions"] },
  coworking: { title: "Coworking", icon: Wifi, keywords: ["coworking", "office", "workspace", "remote"] },
  holidays: { title: "Public Holidays", icon: CalendarDays, keywords: ["holidays", "vacation", "day off"] },
  internet: { title: "Internet & ISP", icon: Wifi, keywords: ["internet", "fiber", "broadband", "speed", "ISP"] },
  weather: { title: "Weather", icon: Leaf, keywords: ["weather", "temperature", "wind", "forecast"] },
  air: { title: "Air Quality", icon: Leaf, keywords: ["air", "quality", "PM2.5", "pollution", "AQI"] },
  schoolrankings: { title: "School Rankings", icon: GraduationCap, keywords: ["school", "rankings", "education", "scores", "MŠMT"] },
  crimemap: { title: "Crime Heatmap", icon: Shield, keywords: ["crime", "heatmap", "hotspots", "safety", "police"] },
  noisesensors: { title: "Noise Sensors", icon: Volume2, keywords: ["noise", "sensors", "decibel", "real-time", "monitoring"] },
  evcharging: { title: "EV Charging", icon: Plug, keywords: ["EV", "charging", "electric", "stations", "Tesla"] },
};

const CHART_COLORS = ["#6b7f5a", "#3d4f3d", "#8a7e6b", "#b8d4a0", "#5a5040", "#4a6b4a"];


export default function Page() {
  const { user, signOut } = useAuth();
  const { plan } = useSubscription();
  const { t } = useI18n();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { y: parallaxY } = useParallax(0.3);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [districtId, setDistrictId] = useState(7);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(SECTIONS.map(s => s.id));
  const [activityOpen, setActivityOpen] = useState(false);
  const [shareTile, setShareTile] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [commandPreview, setCommandPreview] = useState<string | null>(null);
  const [sectionTileOrders, setSectionTileOrders] = useState<Record<string, string[]>>(() => {
    const orders: Record<string, string[]> = {};
    SECTIONS.forEach(s => { orders[s.id] = s.tiles; });
    return orders;
  });
  const [dragState, setDragState] = useState<{ sectionId: string; dragIndex: number | null; overIndex: number | null }>({ sectionId: "", dragIndex: null, overIndex: null });
  const d = getDistrict(districtId);

  // Load saved tile orders from localStorage on mount
  useEffect(() => {
    const orders: Record<string, string[]> = {};
    SECTIONS.forEach(s => { orders[s.id] = getSavedOrder(s.id, s.tiles); });
    setSectionTileOrders(orders);
    trackEvent("page_view", { page: "home" });
  }, []);

  // Single bulk fetch — one request for ALL data, cached client-side per district
  const { data: bulk, loading: bulkLoading } = useBulkData(districtId);
  usePrefetch(districtId); // Prefetch adjacent districts in background

  // Extract sections from bulk data (instant — no network calls)
  const liveWeather = extractSection<{ temperature: number; windspeed: number; description: string }>(bulk, "weather");
  const liveAir = extractSection<{ pm25: number; pm10: number; no2: number; o3: number; aqi: number; status: string }>(bulk, "air");
  const liveTransit = extractSection<{ title: string; link: string; pubDate: string; description: string }[]>(bulk, "transit");
  const liveContracts = extractSection<{ id: string; supplier: string; subject: string; value: number; date: string }[]>(bulk, "contracts");
  const liveHealth = extractSection<{ pharmacies: number; gps: number; specialists: number; hospitals: number; total: number; facilities: { name: string; type: string; address: string }[] }>(bulk, "health");
  const liveWaste = extractSection<{ stations: number; containers: number; types: Record<string, number>; monitoredContainers: number }>(bulk, "waste");
  const liveParks = extractSection<{ total: number; parks: { name: string; description: string }[] }>(bulk, "parks");
  const liveSports = extractSection<{ playgrounds: number; facilities: { name: string; address: string }[] }>(bulk, "sports");
  const liveLibraries = extractSection<{ total: number; libraries: { name: string; address: string; web?: string }[] }>(bulk, "libraries");
  const liveBusiness = extractSection<{ ico: string; name: string; legalForm: string; address: string }>(bulk, "business");
  const liveCityHall = extractSection<{ name: string; address: string; phone?: string; email?: string; web?: string }>(bulk, "cityhall");
  const liveBudget = extractSection<{ source: string; year?: number; totalRevenue?: number; totalExpenditure?: number; surplus?: number; summary?: string }>(bulk, "budget");
  const liveCrime = extractSection<{ source: string; total?: number; change?: number; summary?: string }>(bulk, "crime");
  const liveElections = extractSection<{ source: string; lastElection?: string; turnout?: number; seats?: number; parties?: { name: string; votes: number; seats: number; pct: number }[]; summary?: string }>(bulk, "elections");
  const liveHousing = extractSection<{ source: string; avgRentM2?: number; avgSaleM2?: number; municipalUnits?: number; vacancyRate?: number; summary?: string }>(bulk, "housing");
  const liveEmployment = extractSection<{ source: string; unemploymentRate?: number; jobseekers?: number; avgSalary?: number; topEmployers?: string[]; summary?: string }>(bulk, "employment");
  const liveSchools = extractSection<{ source: string; primary?: number; secondary?: number; kindergarten?: number; universities?: number; total?: number; summary?: string }>(bulk, "schools");
  const liveTenders = extractSection<{ source: string; id?: string; title?: string; estimatedValue?: number; status?: string }[]>(bulk, "tenders");
  const liveEnergy = extractSection<{ heatPriceGJ: number; electricityPriceKWh: number; gasPrice: number; renewableShare: number }>(bulk, "energy");
  const liveWater = extractSection<{ hardness: string; ph: number; nitrates: number; chlorine: number; rating: string; lastTest: string }>(bulk, "water");
  const liveNoise = extractSection<{ dayAvgDb: number; nightAvgDb: number; mainSources: string[]; exceedancePercent: number }>(bulk, "noise");
  const liveEUFunds = extractSection<{ totalProjects: number; totalFunding: number; projects: { name: string; fund: string; amount: number; status: string }[] }>(bulk, "eufunds");
  const livePermits = extractSection<{ total2024: number; pending: number; approved: number; recent: { address: string; type: string; status: string; date: string }[] }>(bulk, "permits");
  const liveParking = extractSection<{ total: number; freeSpaces: number; takenSpaces: number; totalCapacity: number; lots: { name: string; free: number; total: number; address: string }[] }>(bulk, "parking");
  const liveCycling = extractSection<{ counters: number; todayTotal: number; locations: { name: string; count: number }[] }>(bulk, "cycling");
  const liveExchange = extractSection<{ date: string; eur: number; usd: number; gbp: number; rates: { code: string; country: string; amount: number; rate: number }[] }>(bulk, "exchange");
  const liveForeigners = extractSection<{ total: number; percentOfPopulation: number; topNationalities: { country: string; count: number }[]; euCitizens: number; nonEuCitizens: number }>(bulk, "foreigners");
  const liveSocial = extractSection<{ seniorHomes: number; shelters: number; counselingCenters: number; totalProviders: number; services: { name: string; type: string }[] }>(bulk, "social");
  const liveChildcare = extractSection<{ kindergartens: number; totalCapacity: number; waitlistRate: number; facilities: { name: string; capacity: number }[] }>(bulk, "childcare");
  const liveCulture = extractSection<{ theaters: number; galleries: number; cinemas: number; culturalCenters: number; venues: { name: string; type: string }[] }>(bulk, "culture");
  const liveTourism = extractSection<{ annualVisitors: number; hotels: number; airbnbs: number; topAttractions: { name: string; visitors: number }[] }>(bulk, "tourism");
  const liveCoworking = extractSection<{ total: number; spaces: { name: string; address: string; priceFrom: number }[] }>(bulk, "coworking");
  const liveHolidays = extractSection<{ nextHoliday: { name: string; date: string; daysUntil: number }; upcoming: { name: string; date: string }[]; totalPerYear: number }>(bulk, "holidays");
  const liveInternet = extractSection<{ avgDownload: number; avgUpload: number; fiberCoverage: number; providers: { name: string; maxSpeed: number; monthlyPrice: number }[] }>(bulk, "internet");
  const liveSchoolRankings = extractSection<{ totalSchools: number; topRated: { name: string; type: string; score: number; address: string }[]; avgCapacityUtil: number }>(bulk, "schoolrankings");
  const liveCrimeMap = extractSection<{ totalIncidents: number; hotspots: { lat: number; lng: number; count: number; type: string }[]; categories: { label: string; count: number; trend: number }[]; safestArea: string; riskiestArea: string }>(bulk, "crimemap");
  const liveNoiseSensors = extractSection<{ sensors: { id: string; name: string; location: string; currentDb: number; avgDb: number; status: string }[]; districtAvgDb: number; exceedances24h: number; peakHour: string; peakDb: number }>(bulk, "noisesensors");
  const liveEVCharging = extractSection<{ total: number; available: number; stations: { name: string; address: string; connectors: number; powerKW: number; operator: string; status: string }[]; fastChargers: number }>(bulk, "evcharging");

  const allStates = [liveWeather, liveAir, liveTransit, liveContracts, liveHealth, liveWaste, liveParks, liveSports, liveLibraries, liveBusiness, liveCityHall, liveBudget, liveCrime, liveElections, liveHousing, liveEmployment, liveSchools, liveTenders, liveEnergy, liveWater, liveNoise, liveEUFunds, livePermits, liveParking, liveCycling, liveExchange, liveForeigners, liveSocial, liveChildcare, liveCulture, liveTourism, liveCoworking, liveHolidays, liveInternet, liveSchoolRankings, liveCrimeMap, liveNoiseSensors, liveEVCharging];
  const allFetchedAts = allStates.map((s) => s.fetchedAt).filter(Boolean) as string[];
  const latestUpdate = allFetchedAts.length > 0 ? allFetchedAts.sort().reverse()[0] : null;
  const liveCount = allStates.filter(s => s.status === "live").length;

  // Livability scores
  const currentScore = useMemo(() => computeLivabilityScore(d), [d]);
  const allScores = useMemo(() => DISTRICTS.map(dd => ({ id: dd.id, score: computeLivabilityScore(dd).overall })), []);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Open auth dialog if redirected with ?auth=signin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "signin" && !user) {
      setAuthDialogOpen(true);
      window.history.replaceState({}, "", "/");
    }
  }, [user]);

  const isComparing = comparisonIds.length > 0;

  function handleTileExpand(tileId: string) {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setOpenDialog(tileId);
  }

  function handleDragStart(sectionId: string, index: number, e: React.DragEvent) {
    setDragState({ sectionId, dragIndex: index, overIndex: null });
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).style.opacity = "0.5";
  }

  function handleDragOver(sectionId: string, index: number, e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragState.sectionId === sectionId) {
      setDragState(prev => ({ ...prev, overIndex: index }));
    }
  }

  function handleDrop(sectionId: string, index: number, e: React.DragEvent) {
    e.preventDefault();
    if (dragState.sectionId !== sectionId || dragState.dragIndex === null || dragState.dragIndex === index) return;
    setSectionTileOrders(prev => {
      const tiles = [...(prev[sectionId] || [])];
      const [moved] = tiles.splice(dragState.dragIndex!, 1);
      tiles.splice(index, 0, moved);
      saveTileOrder(sectionId, tiles);
      return { ...prev, [sectionId]: tiles };
    });
    setDragState({ sectionId: "", dragIndex: null, overIndex: null });
  }

  function handleDragEnd() {
    setDragState({ sectionId: "", dragIndex: null, overIndex: null });
    document.querySelectorAll("[draggable]").forEach(el => {
      (el as HTMLElement).style.opacity = "1";
    });
  }

  // --- Render Tile Content by ID ---
  function renderTileContent(tileId: string) {
    switch (tileId) {
      case "contracts":
        if (liveContracts.data && liveContracts.data.length > 0) {
          return <><Big>{liveContracts.data.length}</Big><Sub>contracts filed</Sub>{liveContracts.data.slice(0, 2).map((c) => <Row key={c.id} left={c.subject} right={fmtCZK(c.value)} />)}</>;
        }
        if (d.contracts.length > 0) {
          return <><Big>{d.contracts.length}</Big><Sub>contracts filed</Sub>{d.contracts.slice(0, 2).map((c) => <Row key={c.id} left={c.subject} right={fmtCZK(c.value)} />)}</>;
        }
        return <><Big>—</Big><Sub>no recent contracts</Sub></>;

      case "health":
        if (liveHealth.data) {
          return <><Big>{liveHealth.data.total}</Big><Sub>medical facilities</Sub>
          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground/80">
            <span><strong className="text-foreground">{liveHealth.data.pharmacies}</strong> pharmacies</span>
            {liveHealth.data.gps > 0 && <span><strong className="text-foreground">{liveHealth.data.gps}</strong> GPs</span>}
          </div></>;
        }
        return <><Big>{d.health.gps + d.health.specialists + d.health.pharmacies + d.health.hospitals}</Big><Sub>medical facilities</Sub>
        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground/80">
          <span><strong className="text-foreground">{d.health.pharmacies}</strong> pharmacies</span>
        </div></>;

      case "transit":
        if (liveTransit.data && liveTransit.data.length > 0) {
          return <><Big>{liveTransit.data.length}</Big><Sub>active disruptions</Sub>
          {liveTransit.data.slice(0, 2).map((item, i) => <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-muted-foreground/80 hover:text-foreground truncate mt-0.5">{item.title}</a>)}</>;
        }
        return <><Big>{d.transitAlerts.length}</Big><Sub>transit alerts</Sub>
        {d.transitAlerts.slice(0, 2).map((a) => <div key={a.id} className="text-[10px] text-muted-foreground/80 truncate">{a.message}</div>)}</>;

      case "waste":
        if (liveWaste.data) {
          return <><div className="flex gap-4 items-end"><div><Big>{liveWaste.data.stations}</Big><Sub>stations</Sub></div><div><Big>{liveWaste.data.containers}</Big><Sub>containers</Sub></div></div>
          <div className="text-[10px] text-muted-foreground mt-1"><strong className="text-foreground">{liveWaste.data.monitoredContainers}</strong> smart-monitored</div></>;
        }
        return <><Big>{d.waste.recyclingPoints}</Big><Sub>recycling points</Sub><Row left="Recycling rate" right={`${d.waste.recyclingRate}%`} highlight /></>;

      case "sports":
        if (liveSports.data) {
          return <><Big>{liveSports.data.playgrounds}</Big><Sub>playgrounds & courts</Sub>{liveSports.data.facilities.slice(0, 2).map((f) => <div key={f.name} className="text-[10px] text-muted-foreground/80 truncate">{f.name}</div>)}</>;
        }
        return <><Big>{d.sports.playgrounds}</Big><Sub>playgrounds</Sub><Row left="Facilities" right={String(d.sports.facilities.length)} /><Row left="Pools" right={String(d.sports.pools)} /></>;

      case "libraries":
        if (liveLibraries.data) {
          return <><Big>{liveLibraries.data.total}</Big><Sub>public libraries</Sub>{liveLibraries.data.libraries.slice(0, 3).map((lib) => <div key={lib.name} className="text-[10px] text-muted-foreground/80 truncate">{lib.name}</div>)}</>;
        }
        return <><Big>{d.culture.libraries}</Big><Sub>public libraries</Sub></>;

      case "business":
        if (liveBusiness.data) {
          return <><div className="text-xs font-bold text-foreground">{liveBusiness.data.name}</div><div className="text-[10px] text-muted-foreground mt-0.5">ICO {liveBusiness.data.ico}</div><div className="text-[10px] text-muted-foreground/80 truncate">{liveBusiness.data.address}</div></>;
        }
        return <><Big>{d.business.registeredCompanies.toLocaleString()}</Big><Sub>registered businesses</Sub><Row left="New in 2023" right={String(d.business.newIn2023)} /></>;

      case "cityhall":
        if (liveCityHall.data) {
          return <div className="space-y-0.5 text-[10px] text-muted-foreground/80">
            {liveCityHall.data.address && <div>{liveCityHall.data.address}</div>}
            {liveCityHall.data.phone && <div>Tel: <strong>{liveCityHall.data.phone}</strong></div>}
            {liveCityHall.data.email && <div>{liveCityHall.data.email}</div>}
            {liveCityHall.data.web && <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold">{liveCityHall.data.web}</a>}
          </div>;
        }
        return <div className="space-y-0.5 text-[10px] text-muted-foreground/80"><div>{d.mayor}</div><div>{d.mayorParty}</div><a href={d.website} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold">{d.website.replace("https://", "")}</a></div>;

      case "budget": {
        const rev = liveBudget.data?.totalRevenue || d.budget.totalRevenue;
        const exp = liveBudget.data?.totalExpenditure || d.budget.totalExpenditure;
        const surplus = liveBudget.data?.surplus ?? d.budget.surplus;
        const budgetTrend = getTrendForTile("budget", d);
        return <><Big>{fmtCZK(rev * 1_000_000)}{budgetTrend && <TrendArrow current={budgetTrend.history[budgetTrend.history.length - 1]?.value ?? 0} previous={budgetTrend.history[budgetTrend.history.length - 2]?.value ?? 0} />}</Big><Sub>annual revenue</Sub><Row left="Spending" right={fmtCZK(exp * 1_000_000)} /><Row left="Surplus" right={fmtCZK(surplus * 1_000_000)} highlight={surplus >= 0} /></>;
      }

      case "crime": {
        const total = liveCrime.data?.total || d.crime.total2023;
        const change = liveCrime.data?.change ?? d.crime.change;
        return <><Big>{total.toLocaleString()}<TrendArrow current={100 + change} previous={100} invert /></Big><Sub>reported incidents</Sub><div className={`text-[10px] font-bold mt-0.5 ${change < 0 ? "text-accent" : "text-red-600"}`}>{change > 0 ? "+" : ""}{typeof change === "number" ? change.toFixed(1) : change}% year-over-year</div></>;
      }

      case "elections": {
        const turnout = liveElections.data?.turnout || d.elections.turnout;
        const seats = liveElections.data?.seats || d.elections.seats;
        const parties = liveElections.data?.parties || d.elections.coalitions.map(c => ({ name: c.name, votes: 0, seats: c.seats, pct: Math.round(c.seats / seats * 100) }));
        return <>
          <div className="flex gap-4 items-end"><div><Big>{turnout}%</Big><Sub>turnout</Sub></div><div><Big>{seats}</Big><Sub>seats</Sub></div></div>
          <StatProgress label="Voter turnout" value={turnout} className="mt-2" />
          {parties.slice(0, 3).map((p) => <Row key={p.name} left={p.name} right={`${p.pct || p.seats} ${p.pct ? "%" : "seats"}`} />)}
        </>;
      }

      case "housing": {
        const rent = liveHousing.data?.avgRentM2 || d.housing.avgRentM2;
        const sale = liveHousing.data?.avgSaleM2 || d.housing.avgSaleM2;
        const vacancy = liveHousing.data?.vacancyRate ?? d.housing.vacancyRate;
        const housingTrend = getTrendForTile("housing", d);
        return <><Big>{rent} CZK{housingTrend && <TrendArrow current={housingTrend.history[housingTrend.history.length - 1]?.value ?? 0} previous={housingTrend.history[housingTrend.history.length - 2]?.value ?? 0} invert />}</Big><Sub>rent per m²/month</Sub><Row left="Sale price" right={`${sale.toLocaleString()} CZK/m²`} /><StatProgress label="Vacancy rate" value={vacancy} max={10} className="mt-1" /></>;
      }

      case "employment": {
        const rate = liveEmployment.data?.unemploymentRate ?? d.employment.unemploymentRate;
        const salary = liveEmployment.data?.avgSalary || d.employment.avgSalaryCZK;
        const seekers = liveEmployment.data?.jobseekers || d.employment.jobseekers;
        return <><Big>{rate}%</Big><Sub>unemployment</Sub><Row left="Avg salary" right={`${salary.toLocaleString()} CZK`} /><Row left="Jobseekers" right={seekers.toLocaleString()} /></>;
      }

      case "education": {
        const kg = liveSchools.data?.kindergarten ?? d.schools.kindergarten;
        const pr = liveSchools.data?.primary ?? d.schools.primary;
        const sec = liveSchools.data?.secondary ?? d.schools.secondary;
        const uni = liveSchools.data?.universities ?? d.schools.universities;
        return <><Big>{kg + pr + sec + uni}</Big><Sub>schools total</Sub>
        <div className="flex flex-wrap gap-x-3 text-[10px] text-muted-foreground/80 mt-0.5">
          <span><strong>{kg}</strong> kindergartens</span><span><strong>{pr}</strong> primary</span><span><strong>{sec}</strong> secondary</span>{uni > 0 && <span><strong>{uni}</strong> universities</span>}
        </div></>;
      }

      case "tenders":
        if (liveTenders.data && Array.isArray(liveTenders.data) && liveTenders.data.length > 0) {
          return <><Big>{liveTenders.data.length}</Big><Sub>open tenders</Sub>{liveTenders.data.slice(0, 2).map((t, i) => <Row key={i} left={t.title || "Tender"} right={t.estimatedValue ? fmtCZK(t.estimatedValue) : ""} />)}</>;
        }
        if (d.tenders.length > 0) {
          return <><Big>{d.tenders.length}</Big><Sub>public tenders</Sub>{d.tenders.slice(0, 2).map((t) => <Row key={t.id} left={t.title} right={fmtCZK(t.estimatedValue)} />)}</>;
        }
        return <><Big>—</Big><Sub>no open tenders</Sub></>;

      case "energy":
        return liveEnergy.data ? (
          <><Big>{liveEnergy.data.heatPriceGJ}</Big><Sub>CZK/GJ heating</Sub><Row left="Electricity" right={`${liveEnergy.data.electricityPriceKWh} CZK/kWh`} /><StatProgress label="Renewables" value={liveEnergy.data.renewableShare} className="mt-1" /></>
        ) : <><Big>{d.energy.heatPriceGJ}</Big><Sub>CZK/GJ heating</Sub><StatProgress label="Renewables" value={d.energy.renewableShare} className="mt-1" /></>;

      case "water":
        return liveWater.data ? (
          <><Big className="capitalize">{liveWater.data.rating}</Big><Sub>safety rating</Sub><Row left="pH" right={String(liveWater.data.ph)} /><Row left="Nitrates" right={`${liveWater.data.nitrates} mg/l`} /></>
        ) : <><Big className="capitalize">{d.water.rating}</Big><Sub>safety rating</Sub><Row left="pH" right={String(d.water.ph)} /><Row left="Nitrates" right={`${d.water.nitrates} mg/l`} /></>;

      case "demographics":
        return <><Big>{Math.round(d.population / d.area).toLocaleString()}</Big><Sub>people per km²</Sub><Row left="Population" right={d.population.toLocaleString()} /><Row left="Area" right={`${d.area} km²`} /></>;

      case "noise":
        return liveNoise.data ? (
          <><Big>{liveNoise.data.dayAvgDb} dB</Big><Sub>daytime average</Sub><Row left="Night avg" right={`${liveNoise.data.nightAvgDb} dB`} /><StatProgress label="Over limit" value={liveNoise.data.exceedancePercent} className="mt-1" /></>
        ) : <><Big>{d.noiseMaps.dayAvgDb} dB</Big><Sub>daytime average</Sub><Row left="Night avg" right={`${d.noiseMaps.nightAvgDb} dB`} /><Row left="Over limit" right={`${d.noiseMaps.exceedanceAreas}% area`} /></>;

      case "eufunds":
        if (liveEUFunds.data && liveEUFunds.data.totalProjects > 0) {
          return <><Big>{liveEUFunds.data.totalProjects}</Big><Sub>EU-funded projects</Sub><Row left="Total funding" right={`${liveEUFunds.data.totalFunding.toLocaleString()} M CZK`} /></>;
        }
        if (d.euFunds.length > 0) {
          return <><Big>{d.euFunds.length}</Big><Sub>EU-funded projects</Sub><Row left="Total funding" right={`${d.euFunds.reduce((s, p) => s + p.amount, 0).toFixed(1)} M CZK`} /></>;
        }
        return <><Big>—</Big><Sub>no EU fund data</Sub></>;

      case "permits":
        if (livePermits.data && livePermits.data.total2024 > 0) {
          return <><Big>{livePermits.data.total2024}</Big><Sub>permits this year</Sub><Row left="Pending" right={String(livePermits.data.pending)} /><Row left="Approved" right={String(livePermits.data.approved)} highlight /></>;
        }
        if (d.permits.length > 0) {
          return <><Big>{d.permits.length}</Big><Sub>recent permits</Sub><Row left="Pending" right={String(d.permits.filter(p => p.status === "pending").length)} /><Row left="Approved" right={String(d.permits.filter(p => p.status === "approved").length)} highlight /></>;
        }
        return <><Big>—</Big><Sub>no permit data</Sub></>;

      case "parking":
        if (liveParking.data && liveParking.data.total > 0) {
          const occupancy = liveParking.data.totalCapacity > 0 ? Math.round((liveParking.data.takenSpaces / liveParking.data.totalCapacity) * 100) : 0;
          return <><Big>{liveParking.data.freeSpaces}</Big><Sub>free spaces nearby</Sub><Row left="P+R lots" right={String(liveParking.data.total)} /><StatProgress label="Occupancy" value={occupancy} className="mt-1" /></>;
        }
        return <><Big>{d.parking.zone.split("–")[0].trim()}</Big><Sub>parking zone</Sub><Row left="Resident permit" right={`${d.parking.residentRate} CZK/yr`} /></>;

      case "cycling":
        return liveCycling.data && liveCycling.data.counters > 0 ? (
          <><Big>{liveCycling.data.counters}</Big><Sub>bike counters nearby</Sub>{liveCycling.data.todayTotal > 0 && <Row left="Today" right={`${liveCycling.data.todayTotal.toLocaleString()} cyclists`} highlight />}</>
        ) : <><Big>—</Big><Sub>no counter data</Sub></>;

      case "exchange":
        return liveExchange.data ? (
          <><Big>{liveExchange.data.eur.toFixed(2)}</Big><Sub>CZK per EUR</Sub><Row left="USD" right={`${liveExchange.data.usd.toFixed(2)} CZK`} /><Row left="GBP" right={`${liveExchange.data.gbp.toFixed(2)} CZK`} /></>
        ) : <><Big>25.10</Big><Sub>CZK per EUR (est.)</Sub><Row left="USD" right="22.50 CZK" /><Row left="GBP" right="29.20 CZK" /></>;

      case "foreigners":
        return liveForeigners.data ? (
          <><Big>{liveForeigners.data.total.toLocaleString()}</Big><Sub>{liveForeigners.data.percentOfPopulation}% of population</Sub><Row left="EU citizens" right={liveForeigners.data.euCitizens.toLocaleString()} /><Row left="Non-EU" right={liveForeigners.data.nonEuCitizens.toLocaleString()} /></>
        ) : <><Big>—</Big><Sub>foreigner data</Sub><Row left="Status" right="loading..." /></>;

      case "social":
        return liveSocial.data ? (
          <><Big>{liveSocial.data.totalProviders}</Big><Sub>service providers</Sub><Row left="Senior homes" right={String(liveSocial.data.seniorHomes)} /><Row left="Shelters" right={String(liveSocial.data.shelters)} /></>
        ) : <><Big>{d.seniors.seniorCenters}</Big><Sub>senior centers</Sub><Row left="Home care" right={String(d.seniors.homeCareBeneficiaries)} /></>;

      case "childcare":
        return liveChildcare.data ? (
          <><Big>{liveChildcare.data.kindergartens}</Big><Sub>kindergartens</Sub><Row left="Total capacity" right={`${liveChildcare.data.totalCapacity} children`} /><StatProgress label="Waitlist rate" value={liveChildcare.data.waitlistRate} className="mt-1" /></>
        ) : <><Big>{d.schools.kindergarten}</Big><Sub>kindergartens</Sub><Row left="Family centers" right={String(d.family.familyCenters)} /></>;

      case "culture":
        return liveCulture.data ? (
          <><Big>{liveCulture.data.theaters + liveCulture.data.galleries + liveCulture.data.cinemas + liveCulture.data.culturalCenters}</Big><Sub>cultural venues</Sub><Row left="Theaters" right={String(liveCulture.data.theaters)} /><Row left="Galleries" right={String(liveCulture.data.galleries)} /></>
        ) : <><Big>{d.culture.venues}</Big><Sub>cultural venues</Sub><Row left="Libraries" right={String(d.culture.libraries)} /></>;

      case "tourism":
        return liveTourism.data ? (
          <><Big>{(liveTourism.data.annualVisitors / 1_000_000).toFixed(1)}M</Big><Sub>visitors per year</Sub><Row left="Hotels" right={String(liveTourism.data.hotels)} /><Row left="Airbnbs" right={liveTourism.data.airbnbs.toLocaleString()} /></>
        ) : <><Big>—</Big><Sub>tourism data</Sub><Row left="Status" right="loading..." /></>;

      case "coworking":
        return liveCoworking.data ? (
          <><Big>{liveCoworking.data.total}</Big><Sub>coworking spaces</Sub>{liveCoworking.data.spaces.slice(0, 2).map((s, i) => <Row key={i} left={s.name} right={`from ${s.priceFrom} CZK`} />)}</>
        ) : <><Big>—</Big><Sub>coworking data</Sub><Row left="Status" right="loading..." /></>;

      case "holidays":
        return liveHolidays.data ? (
          <><Big>{liveHolidays.data.nextHoliday.daysUntil === 0 ? "Today!" : `${liveHolidays.data.nextHoliday.daysUntil}d`}</Big><Sub>until {liveHolidays.data.nextHoliday.name}</Sub><Row left="Date" right={liveHolidays.data.nextHoliday.date.slice(5)} /><Row left="Holidays/year" right={String(liveHolidays.data.totalPerYear)} /></>
        ) : <><Big>13</Big><Sub>public holidays/year</Sub></>;

      case "internet":
        return liveInternet.data ? (
          <><Big>{liveInternet.data.avgDownload} Mbps</Big><Sub>average download speed</Sub><Row left="Upload" right={`${liveInternet.data.avgUpload} Mbps`} /><StatProgress label="Fiber coverage" value={liveInternet.data.fiberCoverage} className="mt-1" /></>
        ) : <><Big>—</Big><Sub>internet data</Sub><Row left="Status" right="loading..." /></>;

      case "weather":
        return liveWeather.data ? (
          <><Big>{liveWeather.data.temperature}°C</Big><Sub>{liveWeather.data.description}</Sub><Row left="Wind" right={`${liveWeather.data.windspeed} km/h`} /></>
        ) : <><Big>—</Big><Sub>weather data</Sub><Row left="Location" right="Prague" /></>;

      case "air":
        return liveAir.data ? (
          <><Big>{liveAir.data.aqi}</Big><Sub>Air Quality Index</Sub><Row left="PM2.5" right={`${liveAir.data.pm25} µg/m³`} /><Row left="PM10" right={`${liveAir.data.pm10} µg/m³`} /></>
        ) : <><Big>{d.airQuality.aqi}</Big><Sub>Air Quality Index</Sub><Row left="PM2.5" right={`${d.airQuality.pm25} µg/m³`} /><Row left="Status" right={d.airQuality.status} /></>;

      case "schoolrankings":
        return liveSchoolRankings.data ? (
          <><Big>{liveSchoolRankings.data.totalSchools}</Big><Sub>schools rated</Sub><Row left="Avg utilization" right={`${liveSchoolRankings.data.avgCapacityUtil}%`} />{liveSchoolRankings.data.topRated.slice(0, 2).map((s, i) => <Row key={i} left={s.name} right={`${s.score}%`} highlight={s.score >= 90} />)}</>
        ) : <><Big>—</Big><Sub>school rankings</Sub><Row left="Status" right="loading..." /></>;

      case "crimemap":
        return liveCrimeMap.data ? (
          <><Big>{liveCrimeMap.data.totalIncidents.toLocaleString()}</Big><Sub>incidents mapped</Sub><Row left="Hotspots" right={String(liveCrimeMap.data.hotspots.length)} /><Row left="Safest" right={liveCrimeMap.data.safestArea} highlight /></>
        ) : <><Big>—</Big><Sub>crime heatmap</Sub><Row left="Status" right="loading..." /></>;

      case "noisesensors":
        return liveNoiseSensors.data ? (
          <><Big>{liveNoiseSensors.data.districtAvgDb} dB</Big><Sub>live average</Sub><Row left="Sensors" right={String(liveNoiseSensors.data.sensors.length)} /><Row left="Peak" right={`${liveNoiseSensors.data.peakDb} dB @ ${liveNoiseSensors.data.peakHour}`} /><Row left="Exceedances (24h)" right={String(liveNoiseSensors.data.exceedances24h)} highlight={liveNoiseSensors.data.exceedances24h > 3} /></>
        ) : <><Big>—</Big><Sub>noise sensors</Sub><Row left="Status" right="loading..." /></>;

      case "evcharging":
        return liveEVCharging.data ? (
          <><Big>{liveEVCharging.data.total}</Big><Sub>charging stations</Sub><Row left="Available" right={String(liveEVCharging.data.available)} highlight /><Row left="Fast (50kW+)" right={String(liveEVCharging.data.fastChargers)} />{liveEVCharging.data.stations.slice(0, 1).map((s, i) => <Row key={i} left={s.operator} right={`${s.powerKW} kW`} />)}</>
        ) : <><Big>—</Big><Sub>EV charging</Sub><Row left="Status" right="loading..." /></>;

      default:
        return <Skeleton />;
    }
  }

  // --- Render Dialog Content by ID ---
  function renderDialogContent(tileId: string) {
    switch (tileId) {
      case "budget": {
        const rev = liveBudget.data?.totalRevenue || d.budget.totalRevenue;
        const exp = liveBudget.data?.totalExpenditure || d.budget.totalExpenditure;
        const breakdown = d.budget.breakdown || [];
        const trend = d.budget.yearlyTrend || [];
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center"><div className="text-2xl font-black text-foreground">{fmtCZK(rev * 1_000_000)}</div><div className="text-xs text-muted-foreground">Revenue</div></div>
                <div className="bg-secondary rounded-lg p-4 text-center"><div className="text-2xl font-black text-foreground">{fmtCZK(exp * 1_000_000)}</div><div className="text-xs text-muted-foreground">Expenditure</div></div>
              </div>
            </TabsContent>
            <TabsContent value="breakdown" className="mt-4">
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                      {breakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="text-sm text-muted-foreground text-center py-8">No breakdown data available</div>}
            </TabsContent>
            <TabsContent value="trend" className="mt-4">
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Bar dataKey="revenue" fill="#6b7f5a" name="Revenue" />
                    <Bar dataKey="expenditure" fill="#8a7e6b" name="Expenditure" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-sm text-muted-foreground text-center py-8">No trend data available</div>}
            </TabsContent>
          </Tabs>
        );
      }

      case "contracts":
        return liveContracts.data && liveContracts.data.length > 0 ? (
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {liveContracts.data.map((c) => (
                <TableRow key={c.id}><TableCell className="font-medium max-w-[200px] truncate">{c.subject}</TableCell><TableCell>{c.supplier}</TableCell><TableCell className="text-right">{fmtCZK(c.value)}</TableCell><TableCell>{c.date}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <div className="text-sm text-muted-foreground text-center py-8">No contracts data</div>;

      case "elections": {
        const parties = liveElections.data?.parties || d.elections.coalitions.map(c => ({ name: c.name, votes: 0, seats: c.seats, pct: Math.round(c.seats / (d.elections.seats || 1) * 100) }));
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4 text-center"><div className="text-2xl font-black text-foreground">{liveElections.data?.turnout || d.elections.turnout}%</div><div className="text-xs text-muted-foreground">Turnout</div></div>
              <div className="bg-secondary rounded-lg p-4 text-center"><div className="text-2xl font-black text-foreground">{liveElections.data?.seats || d.elections.seats}</div><div className="text-xs text-muted-foreground">Seats</div></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={parties.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <RechartsTooltip />
                <Bar dataKey="seats" fill="#6b7f5a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case "health":
        return liveHealth.data?.facilities && liveHealth.data.facilities.length > 0 ? (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Address</TableHead></TableRow></TableHeader>
            <TableBody>
              {liveHealth.data.facilities.slice(0, 10).map((f, i) => (
                <TableRow key={i}><TableCell className="font-medium">{f.name}</TableCell><TableCell><Badge variant="secondary">{f.type}</Badge></TableCell><TableCell className="text-xs">{f.address}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <div className="text-sm text-muted-foreground text-center py-8">No facility details available</div>;

      case "internet":
        return liveInternet.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveInternet.data.avgDownload}</div><div className="text-[10px] text-muted-foreground">Mbps ↓</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveInternet.data.avgUpload}</div><div className="text-[10px] text-muted-foreground">Mbps ↑</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveInternet.data.fiberCoverage}%</div><div className="text-[10px] text-muted-foreground">Fiber</div></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead className="text-right">Max Speed</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
              <TableBody>
                {liveInternet.data.providers.map((p, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right">{p.maxSpeed} Mbps</TableCell><TableCell className="text-right">{p.monthlyPrice} CZK/mo</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <Skeleton />;

      case "foreigners":
        return liveForeigners.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveForeigners.data.euCitizens.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">EU Citizens</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveForeigners.data.nonEuCitizens.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">Non-EU</div></div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={liveForeigners.data.topNationalities.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 10 }} width={80} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#6b7f5a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Skeleton />;

      case "housing": {
        const rentTrend = d.housing.rentTrend;
        return (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trend">Rent Trend</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{d.housing.avgRentM2}</div><div className="text-[10px] text-muted-foreground">CZK/m²</div></div>
                <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{d.housing.avgSaleM2.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">Sale CZK/m²</div></div>
                <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{d.housing.vacancyRate}%</div><div className="text-[10px] text-muted-foreground">Vacancy</div></div>
              </div>
            </TabsContent>
            <TabsContent value="trend" className="mt-4">
              {rentTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={rentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="avgRent" stroke="#6b7f5a" strokeWidth={2} dot={{ r: 4 }} name="Avg Rent (CZK/m²)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="text-sm text-muted-foreground text-center py-8">No trend data available</div>}
            </TabsContent>
          </Tabs>
        );
      }

      case "schoolrankings":
        return liveSchoolRankings.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveSchoolRankings.data.totalSchools}</div><div className="text-[10px] text-muted-foreground">Schools Rated</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveSchoolRankings.data.avgCapacityUtil}%</div><div className="text-[10px] text-muted-foreground">Avg Utilization</div></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
              <TableBody>
                {liveSchoolRankings.data.topRated.map((s, i) => (
                  <TableRow key={i}><TableCell className="font-medium text-xs">{s.name}</TableCell><TableCell><Badge variant="secondary">{s.type}</Badge></TableCell><TableCell className="text-right font-bold">{s.score}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <Skeleton />;

      case "crimemap":
        return liveCrimeMap.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveCrimeMap.data.totalIncidents.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">Total</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-accent">{liveCrimeMap.data.safestArea}</div><div className="text-[10px] text-muted-foreground">Safest</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-red-500">{liveCrimeMap.data.riskiestArea}</div><div className="text-[10px] text-muted-foreground">Riskiest</div></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={liveCrimeMap.data.categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={80} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#6b7f5a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Skeleton />;

      case "noisesensors":
        return liveNoiseSensors.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveNoiseSensors.data.districtAvgDb} dB</div><div className="text-[10px] text-muted-foreground">Average</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveNoiseSensors.data.peakDb} dB</div><div className="text-[10px] text-muted-foreground">Peak</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveNoiseSensors.data.exceedances24h}</div><div className="text-[10px] text-muted-foreground">Exceedances</div></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Sensor</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Current</TableHead><TableHead className="text-right">Avg</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {liveNoiseSensors.data.sensors.map((s) => (
                  <TableRow key={s.id}><TableCell className="font-medium text-xs">{s.name}</TableCell><TableCell className="text-xs">{s.location}</TableCell><TableCell className="text-right font-bold">{s.currentDb}</TableCell><TableCell className="text-right">{s.avgDb}</TableCell><TableCell><Badge variant={s.status === "warning" ? "destructive" : "secondary"}>{s.status}</Badge></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <Skeleton />;

      case "evcharging":
        return liveEVCharging.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveEVCharging.data.total}</div><div className="text-[10px] text-muted-foreground">Stations</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-accent">{liveEVCharging.data.available}</div><div className="text-[10px] text-muted-foreground">Available</div></div>
              <div className="bg-secondary rounded-lg p-3 text-center"><div className="text-xl font-black text-foreground">{liveEVCharging.data.fastChargers}</div><div className="text-[10px] text-muted-foreground">Fast (50kW+)</div></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Station</TableHead><TableHead>Operator</TableHead><TableHead className="text-right">Power</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {liveEVCharging.data.stations.map((s, i) => (
                  <TableRow key={i}><TableCell className="font-medium text-xs max-w-[140px] truncate">{s.name}</TableCell><TableCell className="text-xs">{s.operator}</TableCell><TableCell className="text-right font-bold">{s.powerKW} kW</TableCell><TableCell><Badge variant={s.status === "Available" ? "secondary" : "outline"}>{s.status}</Badge></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <Skeleton />;

      default:
        return <div className="text-sm text-muted-foreground text-center py-8">Detailed view coming soon</div>;
    }
  }

  // --- Comparison Data ---
  function getComparisonData() {
    const districts = [districtId, ...comparisonIds].map(id => getDistrict(id));
    return districts.map(dd => ({
      name: `P${dd.id}`,
      population: dd.population / 1000,
      rent: dd.housing.avgRentM2 / 10,
      unemployment: dd.employment.unemploymentRate * 10,
      crime: dd.crime.total2023 / 100,
      schools: (dd.schools.primary + dd.schools.secondary + dd.schools.kindergarten) * 2,
      green: dd.greenSpace.parks.length * 5,
    }));
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Gradient Mesh Background */}
      <div className="gradient-mesh" />
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-2xl border-b border-border/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent"><path d="M3 21V9l9-7 9 7v12a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-lg font-black text-foreground tracking-tight">Move<span className="text-accent">Prague</span></span>
            </a>
            <nav className="hidden md:flex items-center gap-0.5">
              <Link href="/how-it-works" className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">{t("nav.howItWorks")}</Link>
              <Link href="/services" className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">{t("nav.services")}</Link>
              <Link href="/pricing" className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-accent hover:bg-accent/10 transition-all">{t("nav.pricing")}</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            {latestUpdate && (
              <span className="text-muted-foreground hidden lg:flex items-center gap-1.5 text-[11px] bg-secondary/60 px-2.5 py-1 rounded-full mr-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {liveCount} live
              </span>
            )}
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={() => setCommandOpen(true)} className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg transition-colors text-[11px] border border-border/50">
              <Search size={12} /> <kbd className="text-[9px] font-mono opacity-60 ml-1">⌘K</kbd>
            </button>
            <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
            {user ? (
              <>
                <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:text-accent transition-colors">{t("nav.dashboard")}</Link>
                <button onClick={() => signOut()} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("nav.signOut")}</button>
              </>
            ) : (
              <button onClick={() => setAuthDialogOpen(true)} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white text-[13px] font-bold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-accent/20">{t("nav.signIn")}</button>
            )}
          </div>
        </div>
      </header>

      {/* Hero — 2-column split */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* LEFT 58% — Dark green hero */}
          <div className="lg:w-[58%] hero-gradient py-10 sm:py-14 relative hero-parallax" style={{ opacity: Math.max(0, 1 - parallaxY / 200), transform: `translateY(${parallaxY * 0.5}px)` }}>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:pl-8 lg:pr-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Text & Stats */}
              <div className="space-y-6">
                {!user && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 bg-accent/20 text-[#b8d4a0] text-xs font-semibold px-3 py-1 rounded-full border border-accent/30">
                      {t("hero.badge")}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                  {user ? d.name : t("hero.title")}
                </h1>
                {!user && (
                  <p className="text-base text-[#b8d4a0] leading-relaxed">
                    {t("hero.subtitle")}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-2xl sm:text-3xl font-black text-white"><AnimatedNumber value={d.population} format={n => new Intl.NumberFormat("en").format(n)} /></div><div className="text-sm text-[#b8d4a0] mt-0.5">{t("hero.residents")}</div></div>
                  <div><div className="text-2xl sm:text-3xl font-black text-white">{d.area}</div><div className="text-sm text-[#b8d4a0] mt-0.5">km²</div></div>
                  <div><div className="text-2xl sm:text-3xl font-black text-white">{d.mayor.split(" ").pop()}</div><div className="text-sm text-[#b8d4a0] mt-0.5">{t("hero.mayor")}</div></div>
                  <div><div className="text-2xl sm:text-3xl font-black text-white"><AnimatedNumber value={currentScore.overall} /><span className="text-lg opacity-60">/100</span></div><div className="text-sm text-[#b8d4a0] mt-0.5">{t("hero.livability")}</div></div>
                </div>
                {!user && (
                  <div className="flex flex-wrap gap-3">
                    <Link href="/pricing" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-accent/25 text-sm">
                      {t("hero.cta")}
                    </Link>
                    <button onClick={() => setAuthDialogOpen(true)} className="inline-flex items-center gap-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-5 py-2.5 rounded-lg transition-colors text-sm">
                      {t("hero.secondary")}
                    </button>
                  </div>
                )}
                {user && (
                  <div className="flex flex-wrap gap-2">
                    {liveWeather.data && <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">{liveWeather.data.temperature}°C · {liveWeather.data.description}</span>}
                    {liveAir.data && <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">AQI {liveAir.data.aqi} · PM2.5 {liveAir.data.pm25}</span>}
                    {liveTransit.data && <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">{liveTransit.data.length} transit alerts</span>}
                  </div>
                )}
              </div>
              {/* Map */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-[360px]">
                  <PragueMap activeDistrict={districtId} onSelectDistrict={setDistrictId} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 42% — Off-white services panel */}
          <div className="lg:w-[42%] bg-[#faf8f5] dark:bg-[#1c1c1a] py-10 sm:py-14 px-6 lg:px-10 flex flex-col justify-center">
            <div className="max-w-md mx-auto lg:mx-0 space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-accent/20 mb-3">
                  Our Reports
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a2e1a] dark:text-foreground leading-tight mt-3">
                  Everything you need to decide with confidence
                </h2>
                <p className="text-sm text-[#5a6b5a] dark:text-muted-foreground mt-2 leading-relaxed">
                  Three expert-powered reports that give you the full picture of any Prague district.
                </p>
              </div>

              {/* Service Card 1 — Price Fairness Check */}
              <Link href="/services/price-check" className="block bg-white dark:bg-card border border-[#e8e4df] dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent/30 transition-all group">
                <div className="flex gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1a2e1a] dark:text-foreground">Price Fairness Check</h3>
                    <p className="text-xs text-[#5a6b5a] dark:text-muted-foreground mt-1 leading-relaxed">Paste any listing URL — our Experts and AI tech will tell you if the price is fair, overpriced, or a bargain.</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-bold text-accent">from 299 Kč</span>
                      <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">Check a listing →</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Service Card 2 — Investment Analysis */}
              <Link href="/services/investment" className="block bg-white dark:bg-card border border-[#e8e4df] dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent/30 transition-all group">
                <div className="flex gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <TrendingUp size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1a2e1a] dark:text-foreground">Investment Analysis</h3>
                    <p className="text-xs text-[#5a6b5a] dark:text-muted-foreground mt-1 leading-relaxed">Comprehensive ROI report with rental yields, price forecasts, development plans, and risks.</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-bold text-accent">from 2 500 Kč</span>
                      <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">Get investment report →</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Service Card 3 — Monthly Market Updates */}
              <Link href="/services/market-updates" className="block bg-white dark:bg-card border border-[#e8e4df] dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent/30 transition-all group">
                <div className="flex gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Bell size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1a2e1a] dark:text-foreground">Monthly Market Updates</h3>
                    <p className="text-xs text-[#5a6b5a] dark:text-muted-foreground mt-1 leading-relaxed">Stay ahead with personalized price alerts, market trends, and AI-generated district intelligence.</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-bold text-accent">from 499 Kč/month</span>
                      <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">Subscribe →</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* District Selector */}
      <div className="bg-card border-b border-border sticky top-12 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <div className="flex gap-1.5 min-w-max md:min-w-0 flex-nowrap md:flex-wrap items-center">
            {DISTRICTS.map((dist) => {
              const distScore = allScores.find(s => s.id === dist.id)?.score ?? 0;
              return (
                <button key={dist.id} onClick={() => { setDistrictId(dist.id); trackEvent("district_selected", { districtId: dist.id }); }} className={`btn-press district-pill px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${dist.id === districtId ? "bg-foreground text-primary-foreground shadow-md" : "bg-secondary text-secondary-foreground hover:bg-accent/20"}`}>
                  Praha {dist.id}
                  <span className="text-[9px] opacity-60">{distScore}</span>
                </button>
              );
            })}
            <div className="w-px h-5 bg-border mx-2" />
            <button onClick={() => setWizardOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors">
              <Compass size={12} /> {t("findYours")}
            </button>
            <button onClick={() => setComparisonIds(comparisonIds.length ? [] : [3, 5])} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${isComparing ? "bg-accent text-white" : "bg-secondary text-secondary-foreground hover:bg-accent/20"}`}>
              <GitCompare size={12} /> {t("compare")}
            </button>
          </div>
        </div>
      </div>

      {/* Top Reviews Strip */}
      {!user && (
        <div className="bg-card/80 border-b border-border py-3 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide text-xs">
              <span className="shrink-0 font-bold text-foreground">{t("reviews.trusted")}</span>
              <span className="shrink-0 text-muted-foreground italic">{t("reviews.quote1")}</span>
              <span className="shrink-0 text-muted-foreground italic">{t("reviews.quote2")}</span>
              <span className="shrink-0 text-muted-foreground italic">{t("reviews.quote3")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Locked Notice for free users */}
      {plan === "free" && (
        <div className="bg-accent/5 border-b border-accent/20 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-3 text-xs">
            <span className="bg-accent text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">{t("locked.badge")}</span>
            <span className="text-foreground">{t("locked.notice")} <Link href="/pricing" className="font-bold text-accent underline">{t("locked.cta")}</Link></span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <span className="breadcrumb-item cursor-pointer" onClick={() => {}}>Prague</span>
          <ChevronRight size={10} className="opacity-50" />
          <span className="breadcrumb-item cursor-pointer font-medium text-foreground">{d.name}</span>
          {openDialog && TILE_META[openDialog] && (<>
            <ChevronRight size={10} className="opacity-50" />
            <span className="text-accent font-medium">{TILE_META[openDialog].title}</span>
          </>)}
        </nav>

        {/* Comparison Mode */}
        {isComparing && (
          <div className="mb-6 bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><GitCompare size={18} className="text-accent" /> District Comparison</h2>
              <div className="flex items-center gap-2">
                {comparisonIds.map(id => (
                  <select key={id} value={id} onChange={e => setComparisonIds(prev => prev.map(x => x === id ? Number(e.target.value) : x))} className="text-xs border border-border rounded-md px-2 py-1 bg-card">
                    {DISTRICTS.filter(dd => dd.id !== districtId).map(dd => <option key={dd.id} value={dd.id}>Praha {dd.id}</option>)}
                  </select>
                ))}
                <button onClick={() => setComparisonIds([])} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={getComparisonData()}>
                  <PolarGrid stroke="#e8e4dc" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} />
                  {[districtId, ...comparisonIds].map((id, i) => (
                    <Radar key={id} name={`Praha ${id}`} dataKey={Object.keys(getComparisonData()[0] || {}).filter(k => k !== "name")[i] || "population"} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.2} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                <Table>
                  <TableHeader><TableRow><TableHead>Metric</TableHead>{[districtId, ...comparisonIds].map(id => <TableHead key={id} className="text-center">Praha {id}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {[
                      { label: "Population", fn: (dd: ReturnType<typeof getDistrict>) => dd.population.toLocaleString() },
                      { label: "Area (km²)", fn: (dd: ReturnType<typeof getDistrict>) => String(dd.area) },
                      { label: "Rent (CZK/m²)", fn: (dd: ReturnType<typeof getDistrict>) => String(dd.housing.avgRentM2) },
                      { label: "Unemployment", fn: (dd: ReturnType<typeof getDistrict>) => `${dd.employment.unemploymentRate}%` },
                      { label: "Crime (2023)", fn: (dd: ReturnType<typeof getDistrict>) => dd.crime.total2023.toLocaleString() },
                      { label: "Schools", fn: (dd: ReturnType<typeof getDistrict>) => String(dd.schools.primary + dd.schools.secondary + dd.schools.kindergarten) },
                    ].map(row => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium text-xs">{row.label}</TableCell>
                        {[districtId, ...comparisonIds].map(id => <TableCell key={id} className="text-center text-xs">{row.fn(getDistrict(id))}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* AI District Summary */}
        <DistrictSummary district={d} bulk={bulk} />

        {/* Accordion Sections */}
        <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections} className="space-y-1">
          {SECTIONS.map((section) => {
            const isSectionLocked = plan === "free" && districtId !== 7;
            return (
            <AccordionItem key={section.id} value={section.id} className="border-none">
              <AccordionTrigger className="hover:no-underline px-2 py-3">
                <div className="flex items-center gap-2.5">
                  <section.icon size={18} className={isSectionLocked ? "text-muted-foreground/50" : "text-accent"} />
                  <span className={`text-base font-extrabold tracking-tight ${isSectionLocked ? "text-muted-foreground/60" : "text-foreground"}`}>{section.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{section.tiles.length}</Badge>
                  {isSectionLocked && <Lock size={12} className="text-muted-foreground/40" />}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {isSectionLocked ? (
                  <div className="bg-card border border-border rounded-xl p-6 text-center">
                    <Lock size={24} className="text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-bold text-foreground mb-1">This section is included in your full report</h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                      Get detailed analysis of {section.tiles.map(t => TILE_META[t]?.title).filter(Boolean).join(", ")} — with verified data, city-average comparisons, and expert commentary.
                    </p>
                    <Link href="/pricing" className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg shadow-accent/25">
                      <Lock size={12} /> Request Full Report
                    </Link>
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-2">
                  {(sectionTileOrders[section.id] || section.tiles).map((tileId, tileIndex) => {
                    const meta = TILE_META[tileId];
                    if (!meta) return null;
                    const isDragOver = dragState.sectionId === section.id && dragState.overIndex === tileIndex && dragState.dragIndex !== tileIndex;
                    return (
                      <div
                        key={tileId}
                        draggable
                        onDragStart={(e) => handleDragStart(section.id, tileIndex, e)}
                        onDragOver={(e) => handleDragOver(section.id, tileIndex, e)}
                        onDrop={(e) => handleDrop(section.id, tileIndex, e)}
                        onDragEnd={handleDragEnd}
                        className={`animate-[fadeInUp_0.4s_ease-out_forwards] opacity-0 transition-transform h-full ${isDragOver ? "scale-105 ring-2 ring-accent/50 rounded-lg" : ""}`}
                        style={{ animationDelay: `${tileIndex * 60}ms` }}
                      >
                        <Tile title={meta.title} icon={meta.icon} onExpand={() => handleTileExpand(tileId)} onShare={() => setShareTile(tileId)}>
                          {renderTileContent(tileId)}
                        </Tile>
                      </div>
                    );
                  })}
                </div>
                )}
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>

      </main>

      {/* What's in a full report — for free users */}
      {plan === "free" && (
        <section className="py-12 bg-card border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">What you get in a full report</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">37 data categories, expert-reviewed analysis, and actionable recommendations — delivered in 24 hours.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { icon: Shield, label: "Crime & Safety Analysis" },
                { icon: Home, label: "Rent & Sale Prices" },
                { icon: GraduationCap, label: "School Rankings" },
                { icon: Train, label: "Transit Connections" },
                { icon: Volume2, label: "Noise Level Maps" },
                { icon: Leaf, label: "Air Quality Index" },
                { icon: Heart, label: "Healthcare Access" },
                { icon: Baby, label: "Childcare & Waitlists" },
                { icon: Briefcase, label: "Employment & Salary" },
                { icon: Building2, label: "Building Permits" },
                { icon: Plug, label: "EV Charging Stations" },
                { icon: Bike, label: "Cycling Infrastructure" },
                { icon: Wallet, label: "District Budget" },
                { icon: Users, label: "Demographics" },
                { icon: Globe, label: "Expat Community %" },
                { icon: Palette, label: "Culture & Events" },
                { icon: Wifi, label: "Internet Speeds" },
                { icon: Car, label: "Parking Availability" },
                { icon: Landmark, label: "City Hall Info" },
                { icon: BarChart3, label: "Livability Score" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border">
                  <item.icon size={14} className="text-accent shrink-0" />
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/pricing" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-accent/25">
                Get Your Full Report — from 799 Kč
              </Link>
              <p className="text-xs text-muted-foreground mt-2">Expert-reviewed • Delivered in 24h • 37 data categories</p>
            </div>
          </div>
        </section>
      )}

      {/* Why Move Prague — Value proposition */}
      <section className="bg-card border-y border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Why people trust Move Prague</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">The average Prague apartment hunter visits 8 districts before deciding. We compress weeks of research into one report.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "37", title: "Data categories", desc: "Crime, rent, schools, noise, transit, air quality, and more — all in one place" },
              { num: "22", title: "Districts covered", desc: "Every single Prague district analyzed with identical methodology" },
              { num: "24h", title: "Expert review", desc: "Each report is reviewed by local analysts before delivery. No automated guesswork." },
              { num: "100%", title: "Verified data", desc: "Cross-referenced from multiple official sources. Updated regularly." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-3xl font-extrabold text-accent">{item.num}</div>
                <div className="text-sm font-bold text-foreground mt-1">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl font-extrabold text-foreground text-center mb-6">What our clients say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { text: "Almost signed in Praha 4. The noise report showed 72 dB at night — completely unlivable. This report saved me thousands.", name: "Tomáš K.", role: "First-time buyer", stars: 5 },
            { text: "As a British expat with zero Czech, this gave me more clarity in one report than 3 weeks of Facebook groups.", name: "Sarah M.", role: "UK expat", stars: 5 },
            { text: "799 Kč for a report vs years of regretting your neighborhood? The best investment I made during my move.", name: "Jakub P.", role: "Renter, Praha 3", stars: 5 },
            { text: "We use the Pro plan for all our relocation clients. The depth of analysis is unmatched. Worth every koruna.", name: "Martin V.", role: "Relocation agency", stars: 5 },
            { text: "The crime heatmap alone would have taken me weeks to research. Got it instantly with verified police data.", name: "Petra N.", role: "Family with kids", stars: 5 },
            { text: "Moved from Berlin. Was choosing between Praha 6 and 7 — the comparison sealed it. Living in 6 now, couldn't be happier.", name: "Klaus D.", role: "German expat", stars: 5 },
            { text: "My real estate agent recommended this. The school rankings section helped us pick the right district for our daughter.", name: "Anna S.", role: "Young family", stars: 5 },
            { text: "The Explorer plan pays for itself. I've looked at 8 districts and the data quality is consistently excellent.", name: "David L.", role: "Investor", stars: 5 },
          ].map((t) => (
            <div key={t.name} className="bg-card border border-border rounded-xl p-4">
              <div className="flex gap-0.5 mb-2">{Array.from({length: t.stars}).map((_, i) => <span key={i} className="text-accent text-xs">★</span>)}</div>
              <p className="text-xs text-foreground italic leading-relaxed">"{t.text}"</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">{t.name[0]}</div>
                <div>
                  <div className="text-[11px] font-bold text-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Services Section */}
      <section className="py-14 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-[11px] font-semibold px-3 py-1 rounded-full border border-accent/20 mb-3">
              <Compass size={11} /> Premium Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Go Beyond District Reports</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">AI-powered real estate intelligence for smarter decisions — whether you&apos;re buying, renting, or investing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Check */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Shield size={20} className="text-accent" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Price Fairness Check</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Paste any listing URL — our AI tells you if the price is fair, overpriced, or a bargain. Includes comparables, red flags, and renovation estimates.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-accent font-bold">from 299 Kč</span>
                <Link href="/services/price-check" className="text-xs font-semibold text-accent hover:underline">Learn more →</Link>
              </div>
            </div>
            {/* Investment */}
            <div className="bg-card border-2 border-accent/30 rounded-2xl p-6 shadow-lg shadow-accent/5 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Most Popular</span>
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <BarChart3 size={20} className="text-accent" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Investment Analysis</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Comprehensive ROI report with rental yields, 5-year price forecast, development plans, risk assessment, and comparison vs bonds/ETFs.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-accent font-bold">from 2 500 Kč</span>
                <Link href="/services/investment" className="text-xs font-semibold text-accent hover:underline">Learn more →</Link>
              </div>
            </div>
            {/* Market Updates */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Globe size={20} className="text-accent" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Monthly Market Updates</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Stay ahead with personalized price alerts, market trends, top movers, news digest, and AI-generated intelligence for your districts.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-accent font-bold">from 499 Kč/mo</span>
                <Link href="/services/market-updates" className="text-xs font-semibold text-accent hover:underline">Learn more →</Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/services" className="inline-flex items-center gap-2 text-foreground border border-border hover:border-accent px-5 py-2.5 rounded-lg transition-colors text-sm font-semibold">
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* Tile Dialog */}
      <Dialog open={!!openDialog} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {openDialog && TILE_META[openDialog] && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const Icon = TILE_META[openDialog].icon; return <Icon size={20} className="text-accent" />; })()}
                  {TILE_META[openDialog].title}
                </DialogTitle>
                <DialogDescription>{d.name} · Detailed view</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {renderDialogContent(openDialog)}
              </div>
              <DialogFooter className="flex-row justify-between items-center">
                <Badge variant="outline" className="text-[10px]">
                  {latestUpdate ? `Updated ${timeAgo(latestUpdate)}` : "Loading..."}
                </Badge>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Command Palette with Live Preview */}
      <CommandDialog open={commandOpen} onOpenChange={(open) => { setCommandOpen(open); if (!open) setCommandPreview(null); }} title="Search" description="Search districts, categories, and actions" className="sm:max-w-2xl">
        <div className="flex">
          <div className="flex-1 min-w-0">
            <CommandInput placeholder="Search districts, stats, actions..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Districts">
                {DISTRICTS.map(dist => (
                  <CommandItem key={dist.id} onSelect={() => { setDistrictId(dist.id); setCommandOpen(false); setCommandPreview(null); }} onMouseEnter={() => setCommandPreview(null)}>
                    <Map size={14} />
                    <span>{dist.name} (Praha {dist.id})</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{allScores.find(s => s.id === dist.id)?.score ?? 0}/100</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Categories">
                {Object.entries(TILE_META).map(([id, meta]) => (
                  <CommandItem key={id} onSelect={() => { handleTileExpand(id); setCommandOpen(false); setCommandPreview(null); }} onMouseEnter={() => setCommandPreview(id)} onFocus={() => setCommandPreview(id)}>
                    <meta.icon size={14} />
                    <span>{meta.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Actions">
                <CommandItem onSelect={() => { setComparisonIds(comparisonIds.length ? [] : [3, 5]); setCommandOpen(false); setCommandPreview(null); }} onMouseEnter={() => setCommandPreview(null)}>
                  <GitCompare size={14} />
                  <span>{isComparing ? "Exit comparison mode" : "Compare districts"}</span>
                </CommandItem>
                <CommandItem onSelect={() => { setWizardOpen(true); setCommandOpen(false); setCommandPreview(null); }} onMouseEnter={() => setCommandPreview(null)}>
                  <Compass size={14} />
                  <span>Find Your District</span>
                </CommandItem>
                <CommandItem onSelect={() => { setActivityOpen(true); setCommandOpen(false); setCommandPreview(null); }} onMouseEnter={() => setCommandPreview(null)}>
                  <Clock size={14} />
                  <span>Activity Feed</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </div>
          {/* Live Preview Panel */}
          {commandPreview && TILE_META[commandPreview] && (
            <div className="hidden sm:block w-56 border-l border-border p-4 bg-secondary/30">
              <div className="flex items-center gap-2 mb-3">
                {(() => { const Icon = TILE_META[commandPreview].icon; return <Icon size={14} className="text-accent" />; })()}
                <span className="text-xs font-bold text-foreground">{TILE_META[commandPreview].title}</span>
              </div>
              <div className="text-xs space-y-1">
                {renderTileContent(commandPreview)}
              </div>
            </div>
          )}
        </div>
      </CommandDialog>

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Activity Feed */}
      <ActivityFeed districtId={districtId} open={activityOpen} onOpenChange={setActivityOpen} />

      {/* Share Card Dialog */}
      {shareTile && TILE_META[shareTile] && (
        <ShareCardDialog
          tileId={shareTile}
          tileTitle={TILE_META[shareTile].title}
          districtName={d.name}
          districtId={districtId}
          statValue="—"
          statLabel="Open to see full data"
          open={!!shareTile}
          onOpenChange={(v) => { if (!v) setShareTile(null); }}
        />
      )}

      {/* Best District Wizard */}
      <DistrictWizard open={wizardOpen} onOpenChange={setWizardOpen} onSelectDistrict={(id) => { setDistrictId(id); setWizardOpen(false); }} />

      {/* Services & Expertise Section */}
      {!user && (
        <section className="relative hero-gradient overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            {/* Section Header */}
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-[#b8d4a0] text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 mb-4">
                Why MovePrague
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Expert-grade intelligence for every decision
              </h2>
              <p className="text-[#b8d4a0] mt-3 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                We combine open government data, real-time sensors, and local expertise to give you a complete picture of any Prague district — before you sign a lease or close a deal.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Shield size={20} className="text-[#b8d4a0]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">Safety & Crime Analysis</h3>
                <p className="text-[#b8d4a0]/80 text-xs leading-relaxed">Real-time crime heatmaps, incident trends, and police district data. Know exactly which streets are safest — day and night.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Home size={20} className="text-[#b8d4a0]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">Housing Market Intelligence</h3>
                <p className="text-[#b8d4a0]/80 text-xs leading-relaxed">Average rents, price per m², vacancy rates, and historical trends. Compare districts side-by-side with real transaction data.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <GraduationCap size={20} className="text-[#b8d4a0]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">School Rankings & Education</h3>
                <p className="text-[#b8d4a0]/80 text-xs leading-relaxed">Ministry-certified school scores, capacity utilization, and parent reviews. Find the best schools within walking distance.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Train size={20} className="text-[#b8d4a0]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">Transit & Connectivity</h3>
                <p className="text-[#b8d4a0]/80 text-xs leading-relaxed">Live disruption feeds, metro/tram coverage, and commute time estimates. Understand how connected your future neighborhood really is.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <BarChart3 size={20} className="text-[#b8d4a0]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">Investment ROI Forecasting</h3>
                <p className="text-[#b8d4a0]/80 text-xs leading-relaxed">Rental yields, price appreciation forecasts, and development pipeline visibility. Make data-backed investment decisions with confidence.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Leaf size={20} className="text-[#b8d4a0]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">Air Quality & Environment</h3>
                <p className="text-[#b8d4a0]/80 text-xs leading-relaxed">PM2.5 monitoring, noise sensor data, and green space indices. Prioritize your health with objective environmental metrics.</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-14 py-8 border-y border-white/10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">37+</div>
                <div className="text-xs text-[#b8d4a0] mt-1">Data categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">22</div>
                <div className="text-xs text-[#b8d4a0] mt-1">Districts covered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">24h</div>
                <div className="text-xs text-[#b8d4a0] mt-1">Expert review turnaround</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">4.9</div>
                <div className="text-xs text-[#b8d4a0] mt-1">Average rating</div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to make an informed decision?</h3>
              <p className="text-[#b8d4a0] text-sm mb-6 max-w-lg mx-auto">
                Get a comprehensive district report reviewed by local experts. Safety, schools, transit, noise — everything in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/pricing" onClick={() => trackEvent("report_cta_clicked", { districtId, source: "bottom_cta" })} className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#2d3f2d] font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl">
                  Get Your Report — from 799 Kč
                </Link>
                <Link href="/services" className="inline-flex items-center gap-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3 rounded-lg transition-colors text-sm font-medium">
                  Explore all services →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto border-t border-border px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <strong className="text-foreground text-base">Move<span className="text-accent">Prague</span></strong>
            <p className="text-muted-foreground text-xs mt-2">{t("footer.desc")}</p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-2">{t("footer.product")}</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-foreground">{t("nav.pricing")}</Link></li>
              <li><Link href="/how-it-works" className="hover:text-foreground">{t("nav.howItWorks")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-2">{t("footer.company")}</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">{t("footer.about")}</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">{t("nav.dashboard")}</Link></li>
              <li><button onClick={() => setAuthDialogOpen(true)} className="hover:text-foreground">{t("nav.signIn")}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-2">{t("footer.legal")}</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><span className="cursor-pointer hover:text-foreground">{t("footer.privacy")}</span></li>
              <li><span className="cursor-pointer hover:text-foreground">{t("footer.terms")}</span></li>
              <li><span className="cursor-pointer hover:text-foreground">{t("footer.contact")}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          {t("footer.copyright")} • <kbd className="font-mono bg-secondary px-1 rounded">⌘K</kbd>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

// --- Helper Components ---

function Tile({ title, icon: Icon, onExpand, onShare, children }: { title: string; icon?: LucideIcon; onExpand: () => void; onShare?: () => void; children: React.ReactNode }) {
  return (
    <TiltCard className="glass-card rounded-lg border-l-4 border-l-accent p-3 cursor-pointer group relative h-full flex flex-col" onClick={onExpand}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={16} className="text-accent" />}
        <h3 className="text-sm font-extrabold text-foreground tracking-tight">{title}</h3>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onShare && <Share2 size={11} className="text-muted-foreground hover:text-accent" onClick={(e) => { e.stopPropagation(); onShare(); }} />}
          <Expand size={11} className="text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </TiltCard>
  );
}

function Big({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-2xl font-black text-foreground leading-tight tracking-tight ${className || ""}`}>{children}</div>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground mb-2">{children}</div>;
}

function Row({ left, right, highlight }: { left: string; right: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-xs py-0.5 gap-2">
      <span className="text-muted-foreground truncate">{left}</span>
      <strong className={`shrink-0 ${highlight ? "text-accent" : "text-foreground"}`}>{right}</strong>
    </div>
  );
}

function StatProgress({ label, value, max = 100, className }: { label: string; value: number; max?: number; className?: string }) {
  return (
    <div className={`space-y-1 ${className || ""}`}>
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <strong className="text-accent">{value}%</strong>
      </div>
      <Progress value={Math.min((value / max) * 100, 100)} className="h-1.5" />
    </div>
  );
}

function Skeleton() {
  return <PragueSkylineLoader />;
}
