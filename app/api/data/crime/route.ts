import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface CrimeData {
  source: string;
  summary?: string;
  total?: number;
  change?: number;
  categories?: Array<{ label: string; count: number }>;
  year?: number;
  lastScraped?: string;
}

const SOURCE = "https://mapakriminality.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `crime-${districtId}`;

  const cached = getCached<CrimeData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CrimeData>);
  }

  const persisted = await getPersistedData<CrimeData>(districtId, "crime");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<CrimeData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<CrimeData | null>);
}
