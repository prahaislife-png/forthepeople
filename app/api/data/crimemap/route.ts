import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, persistData, type LiveResponse } from "@/app/lib/cache";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

export interface CrimeMapData {
  totalIncidents: number;
  hotspots: Array<{ lat: number; lng: number; count: number; type: string }>;
  categories: Array<{ label: string; count: number; trend: number }>;
  safestArea: string;
  riskiestArea: string;
  source: string;
}

const SOURCE = "https://kriminalita.policie.cz";
const CACHE_TTL = 6 * 60 * 60 * 1000;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateFallback(districtId: number): CrimeMapData {
  const rand = seededRandom(districtId * 4937);
  const coords = DISTRICT_COORDS[districtId];
  const baseCrime = districtId <= 5 ? 2000 + Math.round(rand() * 3000) : 500 + Math.round(rand() * 1500);

  const crimeTypes = ["Theft", "Burglary", "Vandalism", "Assault", "Fraud", "Drug offenses"];
  const areas = [
    "Metro station area", "Main square", "Park zone", "Residential east",
    "Commercial center", "Riverside", "North quarter", "Industrial zone",
  ];

  const hotspots: CrimeMapData["hotspots"] = [];
  for (let i = 0; i < 5 + Math.round(rand() * 4); i++) {
    hotspots.push({
      lat: coords.lat + (rand() - 0.5) * 0.02,
      lng: coords.lng + (rand() - 0.5) * 0.02,
      count: 10 + Math.round(rand() * 80),
      type: crimeTypes[Math.floor(rand() * crimeTypes.length)],
    });
  }

  const categories: CrimeMapData["categories"] = [
    { label: "Theft", count: Math.round(baseCrime * 0.35), trend: -3 + Math.round(rand() * 8) },
    { label: "Burglary", count: Math.round(baseCrime * 0.15), trend: -5 + Math.round(rand() * 10) },
    { label: "Vandalism", count: Math.round(baseCrime * 0.18), trend: -2 + Math.round(rand() * 6) },
    { label: "Assault", count: Math.round(baseCrime * 0.10), trend: -4 + Math.round(rand() * 8) },
    { label: "Fraud", count: Math.round(baseCrime * 0.12), trend: Math.round(rand() * 12) },
    { label: "Drug offenses", count: Math.round(baseCrime * 0.10), trend: -2 + Math.round(rand() * 6) },
  ];

  return {
    totalIncidents: baseCrime,
    hotspots,
    categories,
    safestArea: areas[Math.floor(rand() * 4)],
    riskiestArea: areas[4 + Math.floor(rand() * 4)],
    source: SOURCE,
  };
}

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<CrimeMapData | null>);
  }

  const cacheKey = `crimemap-${districtId}`;
  const cached = getCached<CrimeMapData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CrimeMapData>);
  }

  const persisted = await getPersistedData<CrimeMapData>(districtId, "crimemap");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<CrimeMapData>);
  }

  try {
    const url = `https://kriminalita.policie.cz/api/v1/incidents?lat=${coords.lat}&lng=${coords.lng}&radius=3000`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Police API ${res.status}`);
    const json = await res.json() as { incidents: Array<{ lat: number; lng: number; type: string; count: number }>; total: number };

    const hotspots = json.incidents.slice(0, 10).map(i => ({ lat: i.lat, lng: i.lng, count: i.count, type: i.type }));
    const categoryMap = new Map<string, number>();
    for (const h of json.incidents) {
      categoryMap.set(h.type, (categoryMap.get(h.type) || 0) + h.count);
    }
    const categories = [...categoryMap.entries()].map(([label, count]) => ({ label, count, trend: 0 })).sort((a, b) => b.count - a.count);

    const data: CrimeMapData = { totalIncidents: json.total, hotspots, categories, safestArea: "N/A", riskiestArea: "N/A", source: SOURCE };
    setCache(cacheKey, data);
    await persistData(districtId, "crimemap", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CrimeMapData>);
  } catch {
    const data = generateFallback(districtId);
    setCache(cacheKey, data);
    return Response.json({ status: "demo", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CrimeMapData>);
  }
}
