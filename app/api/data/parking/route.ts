import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface ParkingProps {
  name: string;
  num_of_free_places?: number;
  num_of_taken_places?: number;
  total_num_of_places?: number;
  parking_type?: { description?: string };
  address?: { address_formatted?: string };
}

export interface ParkingData {
  total: number;
  freeSpaces: number;
  takenSpaces: number;
  totalCapacity: number;
  lots: Array<{ name: string; free: number; total: number; address: string }>;
}

const SOURCE = "https://api.golemio.cz/v2/parkings";
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<ParkingData | null>);
  }

  const cacheKey = `parking-${districtId}`;
  const cached = getCached<ParkingData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ParkingData>);
  }

  const persisted = await getPersistedData<ParkingData>(districtId, "parking");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<ParkingData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<ParkingProps>>(
      "/parkings",
      { latlng: `${coords.lat},${coords.lng}`, range: "4000", limit: "50" }
    );

    let freeSpaces = 0;
    let takenSpaces = 0;
    let totalCapacity = 0;
    const lots: ParkingData["lots"] = [];

    for (const f of result.features) {
      const free = f.properties.num_of_free_places || 0;
      const taken = f.properties.num_of_taken_places || 0;
      const total = f.properties.total_num_of_places || (free + taken);
      freeSpaces += free;
      takenSpaces += taken;
      totalCapacity += total;
      if (lots.length < 8) {
        lots.push({
          name: f.properties.name || "P+R",
          free,
          total,
          address: f.properties.address?.address_formatted || "",
        });
      }
    }

    const data: ParkingData = { total: result.features.length, freeSpaces, takenSpaces, totalCapacity, lots };
    setCache(cacheKey, data);
    await persistData(districtId, "parking", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ParkingData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<ParkingData | null>);
  }
}
