import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";
import { DISTRICT_ICOS } from "@/app/lib/district-icos";

export interface AresData {
  ico: string;
  name: string;
  legalForm: string;
  address: string;
  czNace: string[];
  registeredSince: string;
}

const SOURCE = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const ico = DISTRICT_ICOS[districtId];
  if (!ico) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<AresData | null>);
  }

  const cacheKey = `ares-${districtId}`;
  const cached = getCached<AresData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<AresData>);
  }

  try {
    const res = await fetch(`${SOURCE}/${ico}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`ARES returned ${res.status}`);

    const json = await res.json();
    const data: AresData = {
      ico: json.ico ?? ico,
      name: json.obchodniJmeno ?? "",
      legalForm: json.pravniForma ?? "",
      address: json.sidlo?.textovaAdresa ?? "",
      czNace: json.czNace2008 ?? json.czNace ?? [],
      registeredSince: json.datumVzniku ?? "",
    };

    setCache(cacheKey, data);
    return Response.json({ status: "live", data, source: `${SOURCE}/${ico}`, fetchedAt: new Date().toISOString() } satisfies LiveResponse<AresData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<AresData | null>);
  }
}
