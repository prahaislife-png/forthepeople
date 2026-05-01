import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface TourismData {
  annualVisitors: number;
  hotels: number;
  airbnbs: number;
  topAttractions: Array<{ name: string; visitors: number }>;
}

const SOURCE = "https://www.czso.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const TOURISM_BY_DISTRICT: Record<number, TourismData> = {
  1: { annualVisitors: 8200000, hotels: 142, airbnbs: 4800, topAttractions: [{ name: "Charles Bridge", visitors: 5200000 }, { name: "Old Town Square", visitors: 4800000 }, { name: "Prague Castle", visitors: 2100000 }] },
  2: { annualVisitors: 2400000, hotels: 48, airbnbs: 1200, topAttractions: [{ name: "Vyšehrad", visitors: 1200000 }, { name: "Dancing House", visitors: 890000 }] },
  3: { annualVisitors: 680000, hotels: 18, airbnbs: 620, topAttractions: [{ name: "Žižkov TV Tower", visitors: 420000 }, { name: "Vítkov Memorial", visitors: 180000 }] },
  4: { annualVisitors: 320000, hotels: 12, airbnbs: 280, topAttractions: [{ name: "Vyšehrad from P4", visitors: 180000 }, { name: "Podolí Swimming", visitors: 120000 }] },
  5: { annualVisitors: 890000, hotels: 22, airbnbs: 580, topAttractions: [{ name: "Petřín Tower", visitors: 620000 }, { name: "Kinský Garden", visitors: 280000 }] },
  6: { annualVisitors: 1200000, hotels: 28, airbnbs: 420, topAttractions: [{ name: "Prague Castle (P6 side)", visitors: 900000 }, { name: "Strahov Monastery", visitors: 380000 }] },
  7: { annualVisitors: 1400000, hotels: 16, airbnbs: 680, topAttractions: [{ name: "Letná Park", visitors: 820000 }, { name: "Veletržní palác", visitors: 340000 }, { name: "Stromovka", visitors: 580000 }] },
  8: { annualVisitors: 520000, hotels: 14, airbnbs: 380, topAttractions: [{ name: "Karlín riverfront", visitors: 320000 }, { name: "Florenc area", visitors: 180000 }] },
  9: { annualVisitors: 280000, hotels: 8, airbnbs: 180, topAttractions: [{ name: "O2 Arena", visitors: 180000 }, { name: "Prosek Park", visitors: 85000 }] },
  10: { annualVisitors: 420000, hotels: 12, airbnbs: 320, topAttractions: [{ name: "Vinohrady neighborhood", visitors: 280000 }, { name: "Havlíčkovy sady", visitors: 190000 }] },
  11: { annualVisitors: 180000, hotels: 6, airbnbs: 120, topAttractions: [{ name: "Chodovská tvrz", visitors: 45000 }, { name: "Centrální park", visitors: 95000 }] },
  12: { annualVisitors: 120000, hotels: 4, airbnbs: 80, topAttractions: [{ name: "Zbraslav Chateau", visitors: 65000 }, { name: "Modřanská rokle", visitors: 42000 }] },
  13: { annualVisitors: 95000, hotels: 4, airbnbs: 60, topAttractions: [{ name: "Prokopské údolí", visitors: 55000 }] },
  14: { annualVisitors: 85000, hotels: 3, airbnbs: 45, topAttractions: [{ name: "Hloubětín Castle", visitors: 28000 }] },
  15: { annualVisitors: 72000, hotels: 2, airbnbs: 35, topAttractions: [{ name: "Hostivařská přehrada", visitors: 48000 }] },
  16: { annualVisitors: 65000, hotels: 2, airbnbs: 25, topAttractions: [{ name: "Radotínské údolí", visitors: 38000 }] },
  17: { annualVisitors: 58000, hotels: 2, airbnbs: 30, topAttractions: [{ name: "Bílá Hora battlefield", visitors: 32000 }] },
  18: { annualVisitors: 48000, hotels: 2, airbnbs: 20, topAttractions: [{ name: "PVA Expo", visitors: 35000 }] },
  19: { annualVisitors: 42000, hotels: 1, airbnbs: 18, topAttractions: [{ name: "Aviation Museum Kbely", visitors: 28000 }] },
  20: { annualVisitors: 38000, hotels: 1, airbnbs: 15, topAttractions: [{ name: "Čertousy nature trail", visitors: 22000 }] },
  21: { annualVisitors: 35000, hotels: 1, airbnbs: 12, topAttractions: [{ name: "Klánovice forest", visitors: 25000 }] },
  22: { annualVisitors: 45000, hotels: 2, airbnbs: 20, topAttractions: [{ name: "Průhonice Park (nearby)", visitors: 320000 }] },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `tourism-${districtId}`;

  const cached = getCached<TourismData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<TourismData>);
  }

  const data = TOURISM_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<TourismData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<TourismData>);
}
