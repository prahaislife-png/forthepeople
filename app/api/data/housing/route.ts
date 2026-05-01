import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface HousingData {
  avgRentM2: number;
  avgSaleM2: number;
  municipalUnits: number;
  vacancyRate: number;
}

const SOURCE = "https://www.sreality.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `housing-${districtId}`;

  const cached = getCached<HousingData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<HousingData>);
  }

  const persisted = await getPersistedData<HousingData>(districtId, "housing");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<HousingData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<HousingData | null>);
}
