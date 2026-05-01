import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface CounterProps {
  id: string;
  name: string;
  directions?: Array<{ id: string; name: string }>;
}

interface MeasurementResponse {
  sum?: number;
  avg?: number;
}

export interface CyclingData {
  counters: number;
  todayTotal: number;
  locations: Array<{ name: string; count: number }>;
}

const SOURCE = "https://api.golemio.cz/v2/bicyclecounters";
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<CyclingData | null>);
  }

  const cacheKey = `cycling-${districtId}`;
  const cached = getCached<CyclingData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CyclingData>);
  }

  const persisted = await getPersistedData<CyclingData>(districtId, "cycling");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<CyclingData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<CounterProps>>(
      "/bicyclecounters",
      { latlng: `${coords.lat},${coords.lng}`, range: "5000", limit: "20" }
    );

    let todayTotal = 0;
    const locations: CyclingData["locations"] = [];

    for (const f of result.features.slice(0, 5)) {
      try {
        const meas = await golemioFetch<MeasurementResponse>(
          `/bicyclecounters/${f.properties.id}/measurements`,
          { aggregate: "sum" }
        );
        const count = meas.sum || 0;
        todayTotal += count;
        locations.push({ name: f.properties.name || "Counter", count });
      } catch {
        locations.push({ name: f.properties.name || "Counter", count: 0 });
      }
    }

    const data: CyclingData = { counters: result.features.length, todayTotal, locations };
    setCache(cacheKey, data);
    await persistData(districtId, "cycling", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CyclingData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<CyclingData | null>);
  }
}
