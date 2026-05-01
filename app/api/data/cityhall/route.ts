import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface MunicipalProps {
  id: string;
  agendas?: Array<{ description: string; keywords?: string[] }>;
  address?: { address_formatted?: string; street_address?: string };
  telephone?: string[];
  email?: string[];
  web?: string[];
  opening_hours?: Array<{ day_of_week: string; opens: string; closes: string }>;
}

export interface CityHallData {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  web?: string;
  services: string[];
  openingHours: Array<{ day: string; hours: string }>;
}

const SOURCE = "https://api.golemio.cz/v2/municipalauthorities";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<CityHallData | null>);
  }

  const cacheKey = `cityhall-${districtId}`;
  const cached = getCached<CityHallData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CityHallData>);
  }

  const persisted = await getPersistedData<CityHallData>(districtId, "cityhall");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<CityHallData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<MunicipalProps>>(
      "/municipalauthorities",
      { latlng: `${coords.lat},${coords.lng}`, range: "3000", limit: "3" }
    );

    const office = result.features[0];
    if (!office) throw new Error("No municipal office found nearby");

    const props = office.properties;
    const data: CityHallData = {
      name: props.id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      address: props.address?.address_formatted || props.address?.street_address || "",
      phone: props.telephone?.[0],
      email: props.email?.[0],
      web: props.web?.[0],
      services: (props.agendas || []).slice(0, 8).map((a) => a.description),
      openingHours: (props.opening_hours || []).map((h) => ({
        day: h.day_of_week,
        hours: `${h.opens}–${h.closes}`,
      })),
    };

    setCache(cacheKey, data);
    await persistData(districtId, "cityhall", data, SOURCE);

    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CityHallData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<CityHallData | null>);
  }
}
