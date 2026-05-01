import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface MedicalProps {
  id: string;
  name: string;
  address: { address_formatted?: string; street_address?: string };
  telephone?: string[];
  web?: string[];
  type: { description: string; group: string; id: string };
  district?: string;
}

export interface HealthData {
  pharmacies: number;
  gps: number;
  specialists: number;
  hospitals: number;
  total: number;
  facilities: Array<{ name: string; type: string; address: string; phone?: string }>;
}

const SOURCE = "https://api.golemio.cz/v2/medicalinstitutions";
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<HealthData | null>);
  }

  const cacheKey = `health-${districtId}`;
  const cached = getCached<HealthData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<HealthData>);
  }

  const persisted = await getPersistedData<HealthData>(districtId, "health");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<HealthData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<MedicalProps>>(
      "/medicalinstitutions",
      { latlng: `${coords.lat},${coords.lng}`, range: "3000", limit: "200" }
    );

    const groups: Record<string, number> = {};
    const facilities: HealthData["facilities"] = [];

    for (const f of result.features) {
      const g = f.properties.type?.group || "other";
      groups[g] = (groups[g] || 0) + 1;
      if (facilities.length < 10) {
        facilities.push({
          name: f.properties.name,
          type: f.properties.type?.description || "",
          address: f.properties.address?.address_formatted || f.properties.address?.street_address || "",
          phone: f.properties.telephone?.[0],
        });
      }
    }

    const data: HealthData = {
      pharmacies: groups["pharmacies"] || 0,
      gps: groups["general_practitioners"] || groups["physicians"] || 0,
      specialists: groups["specialists"] || groups["ambulance"] || 0,
      hospitals: groups["hospitals"] || 0,
      total: result.features.length,
      facilities,
    };

    setCache(cacheKey, data);
    await persistData(districtId, "health", data, SOURCE);

    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<HealthData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<HealthData | null>);
  }
}
