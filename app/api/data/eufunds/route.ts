import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface EUFundsData {
  totalProjects: number;
  totalFunding: number;
  projects: Array<{ name: string; fund: string; amount: number; status: string }>;
}

const SOURCE = "https://dotaceeu.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `eufunds-${districtId}`;

  const cached = getCached<EUFundsData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<EUFundsData>);
  }

  const persisted = await getPersistedData<EUFundsData>(districtId, "eufunds");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<EUFundsData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<EUFundsData | null>);
}
