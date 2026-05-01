import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface EnergyData {
  heatPriceGJ: number;
  electricityPriceKWh: number;
  gasPrice: number;
  renewableShare: number;
}

const SOURCE = "https://www.eru.cz";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `energy-${districtId}`;

  const cached = getCached<EnergyData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<EnergyData>);
  }

  const persisted = await getPersistedData<EnergyData>(districtId, "energy");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<EnergyData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<EnergyData | null>);
}
