import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface ContainerInfo {
  trash_type?: { description: string; id: number };
  cleaning_frequency?: { frequency: number; pick_days: string; next_pick?: string };
  last_measurement?: { percent_calculated?: number; measured_at_utc?: string };
}

interface WasteStationProps {
  id?: number;
  name?: string;
  accessibility?: { description: string };
  containers?: ContainerInfo[];
  station_number?: string;
}

export interface WasteData {
  stations: number;
  containers: number;
  types: Record<string, number>;
  nextPickup?: string;
  monitoredContainers: number;
}

const SOURCE = "https://api.golemio.cz/v2/sortedwastestations";
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<WasteData | null>);
  }

  const cacheKey = `waste-${districtId}`;
  const cached = getCached<WasteData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<WasteData>);
  }

  const persisted = await getPersistedData<WasteData>(districtId, "waste");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<WasteData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<WasteStationProps>>(
      "/sortedwastestations",
      { latlng: `${coords.lat},${coords.lng}`, range: "2000", limit: "100" }
    );

    const types: Record<string, number> = {};
    let totalContainers = 0;
    let monitored = 0;
    let nextPickup: string | undefined;

    for (const f of result.features) {
      for (const c of f.properties.containers || []) {
        totalContainers++;
        const typeName = c.trash_type?.description || "Unknown";
        types[typeName] = (types[typeName] || 0) + 1;
        if (c.last_measurement) monitored++;
        if (c.cleaning_frequency?.next_pick && (!nextPickup || c.cleaning_frequency.next_pick < nextPickup)) {
          nextPickup = c.cleaning_frequency.next_pick;
        }
      }
    }

    const data: WasteData = {
      stations: result.features.length,
      containers: totalContainers,
      types,
      nextPickup,
      monitoredContainers: monitored,
    };

    setCache(cacheKey, data);
    await persistData(districtId, "waste", data, SOURCE);

    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<WasteData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<WasteData | null>);
  }
}
