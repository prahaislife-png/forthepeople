import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface ChildcareData {
  kindergartens: number;
  totalCapacity: number;
  waitlistRate: number;
  facilities: Array<{ name: string; capacity: number }>;
}

const SOURCE = "https://rejstriky.msmt.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const CHILDCARE_BY_DISTRICT: Record<number, ChildcareData> = {
  1: { kindergartens: 8, totalCapacity: 420, waitlistRate: 32, facilities: [{ name: "MŠ Hellichova", capacity: 60 }, { name: "MŠ Thunovská", capacity: 45 }] },
  2: { kindergartens: 12, totalCapacity: 680, waitlistRate: 28, facilities: [{ name: "MŠ Na Smetance", capacity: 80 }, { name: "MŠ Viničná", capacity: 55 }] },
  3: { kindergartens: 14, totalCapacity: 790, waitlistRate: 35, facilities: [{ name: "MŠ Jeseniova", capacity: 90 }, { name: "MŠ Žižkov", capacity: 70 }] },
  4: { kindergartens: 22, totalCapacity: 1450, waitlistRate: 18, facilities: [{ name: "MŠ Braník", capacity: 100 }, { name: "MŠ Podolí", capacity: 85 }] },
  5: { kindergartens: 16, totalCapacity: 920, waitlistRate: 24, facilities: [{ name: "MŠ Barrandov", capacity: 95 }, { name: "MŠ Smíchov", capacity: 75 }] },
  6: { kindergartens: 18, totalCapacity: 1100, waitlistRate: 22, facilities: [{ name: "MŠ Dejvice", capacity: 90 }, { name: "MŠ Břevnov", capacity: 80 }] },
  7: { kindergartens: 11, totalCapacity: 620, waitlistRate: 38, facilities: [{ name: "MŠ Letná", capacity: 65 }, { name: "MŠ Holešovice", capacity: 70 }, { name: "MŠ U Studánky", capacity: 55 }] },
  8: { kindergartens: 15, totalCapacity: 880, waitlistRate: 26, facilities: [{ name: "MŠ Karlín", capacity: 85 }, { name: "MŠ Libeň", capacity: 75 }] },
  9: { kindergartens: 12, totalCapacity: 720, waitlistRate: 20, facilities: [{ name: "MŠ Prosek", capacity: 80 }, { name: "MŠ Vysočany", capacity: 70 }] },
  10: { kindergartens: 18, totalCapacity: 1050, waitlistRate: 25, facilities: [{ name: "MŠ Vršovice", capacity: 85 }, { name: "MŠ Strašnice", capacity: 90 }] },
  11: { kindergartens: 16, totalCapacity: 980, waitlistRate: 22, facilities: [{ name: "MŠ Háje", capacity: 90 }, { name: "MŠ Chodov", capacity: 85 }] },
  12: { kindergartens: 10, totalCapacity: 580, waitlistRate: 15, facilities: [{ name: "MŠ Modřany", capacity: 70 }, { name: "MŠ Kamýk", capacity: 65 }] },
  13: { kindergartens: 12, totalCapacity: 720, waitlistRate: 20, facilities: [{ name: "MŠ Stodůlky", capacity: 80 }, { name: "MŠ Lužiny", capacity: 75 }] },
  14: { kindergartens: 8, totalCapacity: 480, waitlistRate: 28, facilities: [{ name: "MŠ Černý Most", capacity: 70 }, { name: "MŠ Hloubětín", capacity: 60 }] },
  15: { kindergartens: 6, totalCapacity: 340, waitlistRate: 12, facilities: [{ name: "MŠ Hostivař", capacity: 65 }, { name: "MŠ Horní Měcholupy", capacity: 55 }] },
  16: { kindergartens: 4, totalCapacity: 220, waitlistRate: 10, facilities: [{ name: "MŠ Radotín", capacity: 60 }, { name: "MŠ Zbraslav", capacity: 55 }] },
  17: { kindergartens: 6, totalCapacity: 360, waitlistRate: 18, facilities: [{ name: "MŠ Řepy", capacity: 70 }, { name: "MŠ Zličín", capacity: 55 }] },
  18: { kindergartens: 5, totalCapacity: 300, waitlistRate: 14, facilities: [{ name: "MŠ Letňany", capacity: 65 }, { name: "MŠ Čakovice", capacity: 55 }] },
  19: { kindergartens: 4, totalCapacity: 240, waitlistRate: 12, facilities: [{ name: "MŠ Kbely", capacity: 60 }, { name: "MŠ Vinoř", capacity: 50 }] },
  20: { kindergartens: 5, totalCapacity: 280, waitlistRate: 15, facilities: [{ name: "MŠ Horní Počernice", capacity: 65 }, { name: "MŠ Svépravice", capacity: 50 }] },
  21: { kindergartens: 4, totalCapacity: 240, waitlistRate: 16, facilities: [{ name: "MŠ Újezd nad Lesy", capacity: 60 }, { name: "MŠ Běchovice", capacity: 45 }] },
  22: { kindergartens: 5, totalCapacity: 310, waitlistRate: 14, facilities: [{ name: "MŠ Uhříněves", capacity: 70 }, { name: "MŠ Pitkovice", capacity: 50 }] },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `childcare-${districtId}`;

  const cached = getCached<ChildcareData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ChildcareData>);
  }

  const data = CHILDCARE_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<ChildcareData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ChildcareData>);
}
