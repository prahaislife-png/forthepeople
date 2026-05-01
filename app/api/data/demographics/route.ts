import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface DemographicsData {
  population: number;
  avgAge: number;
  birthRate: number;
  deathRate: number;
  migrationBalance: number;
}

const SOURCE = "https://www.czso.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `demographics-${districtId}`;

  const cached = getCached<DemographicsData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<DemographicsData>);
  }

  const persisted = await getPersistedData<DemographicsData>(districtId, "demographics");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<DemographicsData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<DemographicsData | null>);
}
