import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

// Sources for each endpoint
const SOURCES: Record<string, string> = {
  weather: "https://api.open-meteo.com",
  air: "https://air-quality-api.open-meteo.com",
  transit: "https://pid.cz/rss",
  contracts: "https://smlouvy.gov.cz",
  health: "https://api.golemio.cz",
  waste: "https://api.golemio.cz",
  parks: "https://api.golemio.cz",
  sports: "https://api.golemio.cz",
  libraries: "https://api.golemio.cz",
  business: "https://ares.gov.cz",
  cityhall: "https://api.golemio.cz",
  budget: "https://monitor.statnipokladna.cz",
  crime: "https://kriminalita.policie.cz",
  elections: "https://volby.cz",
  housing: "https://www.sreality.cz",
  employment: "https://www.mpsv.cz",
  schools: "https://rejstriky.msmt.cz",
  tenders: "https://nen.nipez.cz",
  energy: "https://www.eru.cz",
  water: "https://www.pvk.cz",
  noise: "https://www.geoportalpraha.cz",
  eufunds: "https://dotaceeu.cz",
  permits: "https://iprpraha.cz",
  parking: "https://api.golemio.cz/v2/parkings",
  cycling: "https://api.golemio.cz/v2/bicyclecounters",
  exchange: "https://www.cnb.cz",
  foreigners: "https://www.czso.cz",
  social: "https://iregistr.mpsv.cz",
  childcare: "https://rejstriky.msmt.cz",
  culture: "https://www.prague.eu",
  tourism: "https://www.czso.cz",
  coworking: "https://www.coworker.com",
  holidays: "https://www.mpsv.cz",
  internet: "https://www.ctu.cz",
  schoolrankings: "https://rejstriky.msmt.cz",
  crimemap: "https://kriminalita.policie.cz",
  noisesensors: "https://www.geoportalpraha.cz",
  evcharging: "https://api.openchargemap.io",
};

const DISTRICT_ENDPOINTS = [
  "contracts", "health", "waste", "parks", "sports", "libraries",
  "business", "cityhall", "budget", "crime", "elections", "housing",
  "employment", "schools", "tenders", "energy", "water", "noise",
  "eufunds", "permits", "parking", "cycling", "foreigners", "social",
  "childcare", "culture", "tourism", "coworking", "internet",
  "schoolrankings", "crimemap", "noisesensors", "evcharging"
];

const GLOBAL_ENDPOINTS = ["weather", "air", "transit", "exchange", "holidays"];

// Cache key mapping — must match what individual routes use
const CACHE_KEY_MAP: Record<string, (districtId: number) => string> = {
  contracts: (id) => `contracts-${id}`,
  health: (id) => `health-${id}`,
  waste: (id) => `waste-${id}`,
  parks: (id) => `parks-${id}`,
  sports: (id) => `sports-${id}`,
  libraries: (id) => `libraries-${id}`,
  business: (id) => `ares-${id}`,
  cityhall: (id) => `cityhall-${id}`,
  budget: (id) => `budget-${id}`,
  crime: (id) => `crime-${id}`,
  elections: (id) => `elections-${id}`,
  housing: (id) => `housing-${id}`,
  employment: (id) => `employment-${id}`,
  schools: (id) => `schools-${id}`,
  tenders: (id) => `tenders-${id}`,
  energy: (id) => `energy-${id}`,
  water: (id) => `water-${id}`,
  noise: (id) => `noise-${id}`,
  eufunds: (id) => `eufunds-${id}`,
  permits: (id) => `permits-${id}`,
  parking: (id) => `parking-${id}`,
  cycling: (id) => `cycling-${id}`,
  foreigners: (id) => `foreigners-${id}`,
  social: (id) => `social-${id}`,
  childcare: (id) => `childcare-${id}`,
  culture: (id) => `culture-${id}`,
  tourism: (id) => `tourism-${id}`,
  coworking: (id) => `coworking-${id}`,
  internet: (id) => `internet-${id}`,
  schoolrankings: (id) => `schoolrankings-${id}`,
  crimemap: (id) => `crimemap-${id}`,
  noisesensors: (id) => `noisesensors-${id}`,
  evcharging: (id) => `evcharging-${id}`,
  weather: () => `weather-prague`,
  air: () => `air-prague`,
  transit: () => `pid-transit`,
  exchange: () => `exchange-rates`,
  holidays: () => `holidays`,
};

const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const results: Record<string, unknown> = {};
  const now = new Date().toISOString();

  // First pass: read everything from in-memory cache (instant, no I/O)
  for (const ep of DISTRICT_ENDPOINTS) {
    const cacheKey = CACHE_KEY_MAP[ep]?.(districtId) ?? `${ep}-${districtId}`;
    const cached = getCached<unknown>(cacheKey, CACHE_TTL);
    if (cached) {
      results[ep] = { status: "live", data: cached, source: SOURCES[ep] || "", fetchedAt: now };
    }
  }
  for (const ep of GLOBAL_ENDPOINTS) {
    const cacheKey = CACHE_KEY_MAP[ep]?.(districtId) ?? ep;
    const cached = getCached<unknown>(cacheKey, CACHE_TTL);
    if (cached) {
      results[ep] = { status: "live", data: cached, source: SOURCES[ep] || "", fetchedAt: now };
    }
  }

  // Second pass: for anything not in memory cache, try persisted DB (parallel)
  const missing = [...DISTRICT_ENDPOINTS, ...GLOBAL_ENDPOINTS].filter(ep => !results[ep]);

  if (missing.length > 0) {
    const persistedResults = await Promise.all(
      missing.map(async (ep) => {
        const persisted = await getPersistedData<unknown>(districtId, ep);
        if (persisted) {
          // Warm the in-memory cache for next time
          const cacheKey = CACHE_KEY_MAP[ep]?.(districtId) ?? (DISTRICT_ENDPOINTS.includes(ep) ? `${ep}-${districtId}` : ep);
          setCache(cacheKey, persisted.data);
          return { ep, result: { status: "live", data: persisted.data, source: SOURCES[ep] || "", fetchedAt: persisted.fetchedAt } };
        }
        return { ep, result: null };
      })
    );

    for (const { ep, result } of persistedResults) {
      if (result) results[ep] = result;
    }
  }

  // Third pass: for still-missing endpoints, call their routes in parallel via HTTP
  const stillMissing = [...DISTRICT_ENDPOINTS, ...GLOBAL_ENDPOINTS].filter(ep => !results[ep]);

  if (stillMissing.length > 0) {
    const baseUrl = request.nextUrl.origin;
    await Promise.all(
      stillMissing.map(async (ep) => {
        try {
          const isDistrict = DISTRICT_ENDPOINTS.includes(ep);
          const url = isDistrict ? `${baseUrl}/api/data/${ep}?district=${districtId}` : `${baseUrl}/api/data/${ep}`;
          const res = await fetch(url, { cache: "no-store" });
          const json = await res.json();
          results[ep] = json;
        } catch {
          results[ep] = { status: "error", data: null, source: SOURCES[ep] || "", fetchedAt: now };
        }
      })
    );
  }

  return Response.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
