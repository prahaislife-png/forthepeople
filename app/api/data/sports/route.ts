import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface PlaygroundProps {
  id: number;
  name: string;
  district?: string;
  address?: { address_formatted?: string };
  properties?: Array<{ id: string; description: string; value?: string }>;
}

export interface SportsData {
  playgrounds: number;
  facilities: Array<{ name: string; address: string }>;
}

const SOURCE = "https://api.golemio.cz/v2/playgrounds";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<SportsData | null>);
  }

  const cacheKey = `sports-${districtId}`;
  const cached = getCached<SportsData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SportsData>);
  }

  const persisted = await getPersistedData<SportsData>(districtId, "sports");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<SportsData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<PlaygroundProps>>(
      "/playgrounds",
      { latlng: `${coords.lat},${coords.lng}`, range: "3000", limit: "100" }
    );

    const data: SportsData = {
      playgrounds: result.features.length,
      facilities: result.features.slice(0, 10).map((f) => ({
        name: f.properties.name,
        address: f.properties.address?.address_formatted || "",
      })),
    };

    setCache(cacheKey, data);
    await persistData(districtId, "sports", data, SOURCE);

    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SportsData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<SportsData | null>);
  }
}
