import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface GardenProps {
  id: string;
  name: string;
  description?: string;
  district?: string;
  address?: { address_formatted?: string };
  properties?: Array<{ id: string; description: string; value?: string }>;
}

export interface ParksData {
  total: number;
  parks: Array<{ name: string; description: string }>;
}

const SOURCE = "https://api.golemio.cz/v2/gardens";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<ParksData | null>);
  }

  const cacheKey = `parks-${districtId}`;
  const cached = getCached<ParksData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ParksData>);
  }

  const persisted = await getPersistedData<ParksData>(districtId, "parks");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<ParksData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<GardenProps>>(
      "/gardens",
      { latlng: `${coords.lat},${coords.lng}`, range: "3000", limit: "50" }
    );

    const data: ParksData = {
      total: result.features.length,
      parks: result.features.map((f) => ({
        name: f.properties.name,
        description: (f.properties.description || "").replace(/<[^>]+>/g, "").slice(0, 150),
      })),
    };

    setCache(cacheKey, data);
    await persistData(districtId, "parks", data, SOURCE);

    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ParksData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<ParksData | null>);
  }
}
