import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface NoiseData {
  dayAvgDb: number;
  nightAvgDb: number;
  mainSources: string[];
  exceedancePercent: number;
}

const SOURCE = "https://www.geoportalpraha.cz";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `noise-${districtId}`;

  const cached = getCached<NoiseData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<NoiseData>);
  }

  const persisted = await getPersistedData<NoiseData>(districtId, "noise");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<NoiseData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<NoiseData | null>);
}
