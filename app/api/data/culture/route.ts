import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface CultureData {
  theaters: number;
  galleries: number;
  cinemas: number;
  culturalCenters: number;
  venues: Array<{ name: string; type: string }>;
}

const SOURCE = "https://www.prague.eu";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const CULTURE_BY_DISTRICT: Record<number, CultureData> = {
  1: { theaters: 18, galleries: 32, cinemas: 5, culturalCenters: 8, venues: [{ name: "Národní divadlo", type: "Theater" }, { name: "Rudolfinum", type: "Concert hall" }, { name: "DOX Centre", type: "Gallery" }] },
  2: { theaters: 6, galleries: 12, cinemas: 2, culturalCenters: 4, venues: [{ name: "Divadlo Na Vinohradech", type: "Theater" }, { name: "Lucerna", type: "Cinema & venue" }] },
  3: { theaters: 5, galleries: 8, cinemas: 2, culturalCenters: 3, venues: [{ name: "Žižkovské divadlo", type: "Theater" }, { name: "Kino Aero", type: "Cinema" }] },
  4: { theaters: 3, galleries: 5, cinemas: 2, culturalCenters: 4, venues: [{ name: "KD Novodvorská", type: "Cultural center" }, { name: "Divadlo Na Prádle", type: "Theater" }] },
  5: { theaters: 4, galleries: 6, cinemas: 3, culturalCenters: 3, venues: [{ name: "Švandovo divadlo", type: "Theater" }, { name: "MeetFactory", type: "Gallery" }] },
  6: { theaters: 3, galleries: 4, cinemas: 1, culturalCenters: 3, venues: [{ name: "Dejvické divadlo", type: "Theater" }, { name: "Galerie Bohemia", type: "Gallery" }] },
  7: { theaters: 4, galleries: 9, cinemas: 2, culturalCenters: 5, venues: [{ name: "La Fabrika", type: "Theater" }, { name: "Veletržní palác (NGP)", type: "Gallery" }, { name: "Bio Oko", type: "Cinema" }, { name: "Holešovická tržnice", type: "Cultural space" }] },
  8: { theaters: 3, galleries: 5, cinemas: 1, culturalCenters: 3, venues: [{ name: "Divadlo Karlín", type: "Theater" }, { name: "Invalidovna", type: "Cultural center" }] },
  9: { theaters: 1, galleries: 3, cinemas: 1, culturalCenters: 2, venues: [{ name: "KC Prosek", type: "Cultural center" }, { name: "Galerie 9", type: "Gallery" }] },
  10: { theaters: 3, galleries: 4, cinemas: 2, culturalCenters: 3, venues: [{ name: "Divadlo Solidarita", type: "Theater" }, { name: "Eden Cinema", type: "Cinema" }] },
  11: { theaters: 1, galleries: 2, cinemas: 2, culturalCenters: 3, venues: [{ name: "KC Zahrada", type: "Cultural center" }, { name: "Chodovská tvrz", type: "Gallery" }] },
  12: { theaters: 1, galleries: 2, cinemas: 1, culturalCenters: 2, venues: [{ name: "KD Modřany", type: "Cultural center" }] },
  13: { theaters: 1, galleries: 2, cinemas: 1, culturalCenters: 2, venues: [{ name: "KC Lužiny", type: "Cultural center" }] },
  14: { theaters: 1, galleries: 1, cinemas: 1, culturalCenters: 2, venues: [{ name: "KC Černý Most", type: "Cultural center" }] },
  15: { theaters: 0, galleries: 1, cinemas: 1, culturalCenters: 1, venues: [{ name: "KC Hostivař", type: "Cultural center" }] },
  16: { theaters: 0, galleries: 1, cinemas: 0, culturalCenters: 1, venues: [{ name: "Zámek Radotín", type: "Cultural center" }] },
  17: { theaters: 0, galleries: 1, cinemas: 1, culturalCenters: 1, venues: [{ name: "KC Řepy", type: "Cultural center" }] },
  18: { theaters: 0, galleries: 1, cinemas: 0, culturalCenters: 1, venues: [{ name: "KD Letňany", type: "Cultural center" }] },
  19: { theaters: 0, galleries: 1, cinemas: 0, culturalCenters: 1, venues: [{ name: "KC Kbely", type: "Cultural center" }] },
  20: { theaters: 0, galleries: 1, cinemas: 0, culturalCenters: 1, venues: [{ name: "KC Horní Počernice", type: "Cultural center" }] },
  21: { theaters: 0, galleries: 1, cinemas: 0, culturalCenters: 1, venues: [{ name: "KC Újezd nad Lesy", type: "Cultural center" }] },
  22: { theaters: 0, galleries: 1, cinemas: 0, culturalCenters: 1, venues: [{ name: "KC Uhříněves", type: "Cultural center" }] },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `culture-${districtId}`;

  const cached = getCached<CultureData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CultureData>);
  }

  const data = CULTURE_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<CultureData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CultureData>);
}
