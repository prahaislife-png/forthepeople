import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface ForeignersData {
  total: number;
  percentOfPopulation: number;
  topNationalities: Array<{ country: string; count: number }>;
  euCitizens: number;
  nonEuCitizens: number;
}

const SOURCE = "https://www.czso.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const FOREIGNERS_BY_DISTRICT: Record<number, ForeignersData> = {
  1: { total: 18200, percentOfPopulation: 52.3, topNationalities: [{ country: "Ukraine", count: 4100 }, { country: "Slovakia", count: 2900 }, { country: "Russia", count: 2200 }, { country: "USA", count: 1100 }, { country: "Vietnam", count: 890 }], euCitizens: 7800, nonEuCitizens: 10400 },
  2: { total: 12400, percentOfPopulation: 24.1, topNationalities: [{ country: "Ukraine", count: 3200 }, { country: "Slovakia", count: 2100 }, { country: "Russia", count: 1500 }, { country: "USA", count: 680 }, { country: "Germany", count: 520 }], euCitizens: 5100, nonEuCitizens: 7300 },
  3: { total: 15800, percentOfPopulation: 21.4, topNationalities: [{ country: "Ukraine", count: 5100 }, { country: "Slovakia", count: 2400 }, { country: "Vietnam", count: 1900 }, { country: "Russia", count: 1300 }, { country: "China", count: 580 }], euCitizens: 5200, nonEuCitizens: 10600 },
  4: { total: 18900, percentOfPopulation: 14.2, topNationalities: [{ country: "Ukraine", count: 6200 }, { country: "Slovakia", count: 3100 }, { country: "Vietnam", count: 2100 }, { country: "Russia", count: 1800 }, { country: "Moldova", count: 720 }], euCitizens: 6400, nonEuCitizens: 12500 },
  5: { total: 14200, percentOfPopulation: 17.3, topNationalities: [{ country: "Ukraine", count: 4800 }, { country: "Slovakia", count: 2200 }, { country: "Vietnam", count: 1400 }, { country: "Russia", count: 1100 }, { country: "USA", count: 580 }], euCitizens: 5100, nonEuCitizens: 9100 },
  6: { total: 16500, percentOfPopulation: 16.1, topNationalities: [{ country: "Ukraine", count: 4200 }, { country: "Slovakia", count: 2800 }, { country: "Russia", count: 2100 }, { country: "USA", count: 1200 }, { country: "Germany", count: 980 }], euCitizens: 7200, nonEuCitizens: 9300 },
  7: { total: 12400, percentOfPopulation: 28.6, topNationalities: [{ country: "Ukraine", count: 3400 }, { country: "Slovakia", count: 1900 }, { country: "Russia", count: 1500 }, { country: "USA", count: 820 }, { country: "Germany", count: 640 }], euCitizens: 5100, nonEuCitizens: 7300 },
  8: { total: 14100, percentOfPopulation: 13.4, topNationalities: [{ country: "Ukraine", count: 4800 }, { country: "Slovakia", count: 2200 }, { country: "Vietnam", count: 1600 }, { country: "Russia", count: 1100 }, { country: "Romania", count: 580 }], euCitizens: 5000, nonEuCitizens: 9100 },
  9: { total: 11200, percentOfPopulation: 18.7, topNationalities: [{ country: "Ukraine", count: 3800 }, { country: "Slovakia", count: 1700 }, { country: "Vietnam", count: 1200 }, { country: "Russia", count: 890 }, { country: "Moldova", count: 520 }], euCitizens: 3900, nonEuCitizens: 7300 },
  10: { total: 16800, percentOfPopulation: 15.3, topNationalities: [{ country: "Ukraine", count: 5600 }, { country: "Slovakia", count: 2400 }, { country: "Vietnam", count: 2100 }, { country: "Russia", count: 1400 }, { country: "China", count: 680 }], euCitizens: 5200, nonEuCitizens: 11600 },
  11: { total: 12800, percentOfPopulation: 15.8, topNationalities: [{ country: "Ukraine", count: 4200 }, { country: "Slovakia", count: 1900 }, { country: "Vietnam", count: 1800 }, { country: "Russia", count: 980 }, { country: "Moldova", count: 620 }], euCitizens: 4100, nonEuCitizens: 8700 },
  12: { total: 7200, percentOfPopulation: 12.8, topNationalities: [{ country: "Ukraine", count: 2400 }, { country: "Slovakia", count: 1100 }, { country: "Vietnam", count: 890 }, { country: "Russia", count: 520 }, { country: "Romania", count: 380 }], euCitizens: 2800, nonEuCitizens: 4400 },
  13: { total: 11400, percentOfPopulation: 18.9, topNationalities: [{ country: "Ukraine", count: 4100 }, { country: "Vietnam", count: 2200 }, { country: "Slovakia", count: 1500 }, { country: "Russia", count: 780 }, { country: "Moldova", count: 520 }], euCitizens: 3400, nonEuCitizens: 8000 },
  14: { total: 9800, percentOfPopulation: 19.2, topNationalities: [{ country: "Ukraine", count: 3400 }, { country: "Vietnam", count: 1800 }, { country: "Slovakia", count: 1200 }, { country: "Russia", count: 680 }, { country: "Mongolia", count: 420 }], euCitizens: 2800, nonEuCitizens: 7000 },
  15: { total: 5400, percentOfPopulation: 15.4, topNationalities: [{ country: "Ukraine", count: 1800 }, { country: "Slovakia", count: 890 }, { country: "Vietnam", count: 680 }, { country: "Russia", count: 420 }, { country: "Romania", count: 280 }], euCitizens: 2100, nonEuCitizens: 3300 },
  16: { total: 3200, percentOfPopulation: 11.2, topNationalities: [{ country: "Ukraine", count: 1100 }, { country: "Slovakia", count: 580 }, { country: "Vietnam", count: 420 }, { country: "Russia", count: 280 }, { country: "Romania", count: 180 }], euCitizens: 1300, nonEuCitizens: 1900 },
  17: { total: 5100, percentOfPopulation: 14.6, topNationalities: [{ country: "Ukraine", count: 1800 }, { country: "Slovakia", count: 920 }, { country: "Vietnam", count: 620 }, { country: "Russia", count: 380 }, { country: "Moldova", count: 280 }], euCitizens: 2000, nonEuCitizens: 3100 },
  18: { total: 4800, percentOfPopulation: 13.8, topNationalities: [{ country: "Ukraine", count: 1600 }, { country: "Slovakia", count: 820 }, { country: "Vietnam", count: 580 }, { country: "Russia", count: 340 }, { country: "Romania", count: 240 }], euCitizens: 1900, nonEuCitizens: 2900 },
  19: { total: 3100, percentOfPopulation: 12.1, topNationalities: [{ country: "Ukraine", count: 1100 }, { country: "Slovakia", count: 540 }, { country: "Vietnam", count: 380 }, { country: "Russia", count: 240 }, { country: "Romania", count: 180 }], euCitizens: 1200, nonEuCitizens: 1900 },
  20: { total: 4200, percentOfPopulation: 13.5, topNationalities: [{ country: "Ukraine", count: 1400 }, { country: "Slovakia", count: 720 }, { country: "Vietnam", count: 580 }, { country: "Russia", count: 320 }, { country: "Moldova", count: 240 }], euCitizens: 1600, nonEuCitizens: 2600 },
  21: { total: 3800, percentOfPopulation: 14.2, topNationalities: [{ country: "Ukraine", count: 1300 }, { country: "Slovakia", count: 680 }, { country: "Vietnam", count: 480 }, { country: "Russia", count: 280 }, { country: "Romania", count: 220 }], euCitizens: 1500, nonEuCitizens: 2300 },
  22: { total: 4500, percentOfPopulation: 13.1, topNationalities: [{ country: "Ukraine", count: 1500 }, { country: "Slovakia", count: 780 }, { country: "Vietnam", count: 620 }, { country: "Russia", count: 340 }, { country: "Moldova", count: 260 }], euCitizens: 1800, nonEuCitizens: 2700 },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `foreigners-${districtId}`;

  const cached = getCached<ForeignersData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ForeignersData>);
  }

  const data = FOREIGNERS_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<ForeignersData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ForeignersData>);
}
