import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, persistData, type LiveResponse } from "@/app/lib/cache";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

export interface SchoolRankingsData {
  totalSchools: number;
  topRated: Array<{ name: string; type: string; score: number; address: string }>;
  avgCapacityUtil: number;
  source: string;
}

const SOURCE = "https://rejstriky.msmt.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateFallback(districtId: number): SchoolRankingsData {
  const rand = seededRandom(districtId * 3571);
  const totalSchools = 8 + Math.round(rand() * 20);
  const types = ["Primary", "Grammar", "Vocational", "Kindergarten", "Language"];
  const names = [
    "ZŠ nám. Jiřího z Poděbrad", "ZŠ Korunovační", "Gymnázium Na Pražačce",
    "ZŠ Letohradská", "ZŠ Fr. Plamínkové", "SOŠ Drtinova", "ZŠ Strossmayerovo",
    "MŠ Pod Kaštany", "Gymnázium Na Zatlance", "ZŠ Tusarova",
    "ZŠ Šimáčkova", "SOŠ gastronomie", "Lyceum Holešovice",
  ];
  const streets = [
    "Korunovační 8", "Letohradská 1", "Nad Štolou 1", "Tusarova 21",
    "Pplk. Sochora 14", "Strossmayerovo nám. 4", "Fr. Křížka 2",
    "U Průhonu 13", "Ortenovo nám. 34", "Janovského 52",
  ];

  const topRated: SchoolRankingsData["topRated"] = [];
  for (let i = 0; i < Math.min(6, totalSchools); i++) {
    topRated.push({
      name: names[i % names.length],
      type: types[Math.floor(rand() * types.length)],
      score: Math.round((75 + rand() * 25) * 10) / 10,
      address: streets[i % streets.length],
    });
  }
  topRated.sort((a, b) => b.score - a.score);

  return {
    totalSchools,
    topRated,
    avgCapacityUtil: Math.round(70 + rand() * 25),
    source: SOURCE,
  };
}

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<SchoolRankingsData | null>);
  }

  const cacheKey = `schoolrankings-${districtId}`;
  const cached = getCached<SchoolRankingsData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SchoolRankingsData>);
  }

  const persisted = await getPersistedData<SchoolRankingsData>(districtId, "schoolrankings");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<SchoolRankingsData>);
  }

  try {
    const url = `https://rejstriky.msmt.cz/api/school?lat=${coords.lat}&lng=${coords.lng}&radius=3000&limit=20`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`MSMT API ${res.status}`);
    const json = await res.json() as Array<{ name: string; type: string; capacity: number; enrolled: number; address: string }>;

    const topRated = json.slice(0, 6).map(s => ({
      name: s.name,
      type: s.type,
      score: Math.round((s.enrolled / Math.max(s.capacity, 1)) * 100 * 10) / 10,
      address: s.address,
    })).sort((a, b) => b.score - a.score);

    const avgCapacityUtil = json.length > 0
      ? Math.round(json.reduce((sum, s) => sum + (s.enrolled / Math.max(s.capacity, 1)), 0) / json.length * 100)
      : 80;

    const data: SchoolRankingsData = { totalSchools: json.length, topRated, avgCapacityUtil, source: SOURCE };
    setCache(cacheKey, data);
    await persistData(districtId, "schoolrankings", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SchoolRankingsData>);
  } catch {
    const data = generateFallback(districtId);
    setCache(cacheKey, data);
    return Response.json({ status: "demo", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SchoolRankingsData>);
  }
}
