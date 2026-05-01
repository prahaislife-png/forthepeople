import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface WaterQualityData {
  hardness: string;
  ph: number;
  nitrates: number;
  chlorine: number;
  rating: string;
  lastTest: string;
}

const SOURCE = "https://www.pvk.cz";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `water-${districtId}`;

  const cached = getCached<WaterQualityData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<WaterQualityData>);
  }

  const persisted = await getPersistedData<WaterQualityData>(districtId, "water");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<WaterQualityData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<WaterQualityData | null>);
}
