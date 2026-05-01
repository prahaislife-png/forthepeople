import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface SchoolsData {
  primary: number;
  secondary: number;
  kindergarten: number;
  universities: number;
  total: number;
}

const SOURCE = "https://rejstriky.msmt.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `schools-${districtId}`;

  const cached = getCached<SchoolsData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SchoolsData>);
  }

  const persisted = await getPersistedData<SchoolsData>(districtId, "schools");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<SchoolsData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<SchoolsData | null>);
}
