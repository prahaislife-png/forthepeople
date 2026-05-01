import { NextRequest } from "next/server";
import { getCached, setCache, persistData, getPersistedData, type LiveResponse } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

interface LibraryProps {
  id: number;
  name: string;
  address: { address_formatted?: string; street_address?: string };
  email?: string;
  telephone?: string;
  web?: string;
  district?: string;
  opening_hours?: Array<{ day_of_week: string; opens: string; closes: string }>;
}

export interface LibrariesData {
  total: number;
  libraries: Array<{ name: string; address: string; web?: string }>;
}

const SOURCE = "https://api.golemio.cz/v2/municipallibraries";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<LibrariesData | null>);
  }

  const cacheKey = `libraries-${districtId}`;
  const cached = getCached<LibrariesData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<LibrariesData>);
  }

  const persisted = await getPersistedData<LibrariesData>(districtId, "libraries");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<LibrariesData>);
  }

  try {
    const result = await golemioFetch<GolemioFeatureCollection<LibraryProps>>(
      "/municipallibraries",
      { latlng: `${coords.lat},${coords.lng}`, range: "3000", limit: "50" }
    );

    const data: LibrariesData = {
      total: result.features.length,
      libraries: result.features.map((f) => ({
        name: f.properties.name,
        address: f.properties.address?.address_formatted || f.properties.address?.street_address || "",
        web: f.properties.web,
      })),
    };

    setCache(cacheKey, data);
    await persistData(districtId, "libraries", data, SOURCE);

    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<LibrariesData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<LibrariesData | null>);
  }
}
