import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface CoworkingData {
  total: number;
  spaces: Array<{ name: string; address: string; priceFrom: number }>;
}

const SOURCE = "https://www.coworker.com";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const COWORKING_BY_DISTRICT: Record<number, CoworkingData> = {
  1: { total: 42, spaces: [{ name: "WeWork Národní", address: "Národní 135/14", priceFrom: 6500 }, { name: "Impact Hub Praha", address: "Drtinova 10", priceFrom: 4900 }, { name: "Node5", address: "Radlická 50", priceFrom: 3500 }] },
  2: { total: 18, spaces: [{ name: "K10 Coworking", address: "Krymská 10", priceFrom: 4500 }, { name: "Opero", address: "Salvátorská 10", priceFrom: 5200 }] },
  3: { total: 12, spaces: [{ name: "Locus Workspace", address: "Chlumova 8", priceFrom: 3800 }, { name: "Work Lounge Žižkov", address: "Koněvova 124", priceFrom: 3200 }] },
  4: { total: 8, spaces: [{ name: "Pankrác Office Hub", address: "Na Pankráci 30", priceFrom: 4200 }, { name: "Budějovická Work", address: "Budějovická 1", priceFrom: 3800 }] },
  5: { total: 14, spaces: [{ name: "Smíchov Station", address: "Nádražní 32", priceFrom: 4500 }, { name: "MeetFactory Work", address: "Ke Sklárně 3213", priceFrom: 3000 }] },
  6: { total: 10, spaces: [{ name: "Dejvice Workspace", address: "Evropská 12", priceFrom: 4800 }, { name: "TechPark Vokovice", address: "Vokovická 8", priceFrom: 5500 }] },
  7: { total: 16, spaces: [{ name: "Vnitroblock", address: "Tusarova 31", priceFrom: 3500 }, { name: "Paper Hub", address: "Bubenská 1", priceFrom: 4200 }, { name: "Holešovice Work", address: "Komunardů 30", priceFrom: 3800 }] },
  8: { total: 22, spaces: [{ name: "HubHub Karlín", address: "Karolinská 706/3", priceFrom: 5900 }, { name: "Spaces Karlín", address: "Pernerova 691/42", priceFrom: 6200 }, { name: "Pracovna Karlín", address: "Křižíkova 72", priceFrom: 3200 }] },
  9: { total: 6, spaces: [{ name: "Prosek Workspace", address: "Vysočanská 2", priceFrom: 2800 }, { name: "O2 Cowork", address: "Českomoravská 2420", priceFrom: 3500 }] },
  10: { total: 11, spaces: [{ name: "Vinohrady Hub", address: "Vinohradská 184", priceFrom: 4200 }, { name: "Strašnice Office", address: "Průběžná 1", priceFrom: 3000 }] },
  11: { total: 4, spaces: [{ name: "Chodov Business", address: "Roztylská 2321", priceFrom: 2800 }] },
  12: { total: 3, spaces: [{ name: "Modřany Workspace", address: "Komořanská 72", priceFrom: 2500 }] },
  13: { total: 5, spaces: [{ name: "Stodůlky Hub", address: "Bucharova 2657", priceFrom: 3200 }] },
  14: { total: 3, spaces: [{ name: "Černý Most Office", address: "Chlumecká 5", priceFrom: 2400 }] },
  15: { total: 2, spaces: [{ name: "Hostivař Work", address: "Švehlova 32", priceFrom: 2200 }] },
  16: { total: 1, spaces: [{ name: "Radotín Office", address: "Výpadová 1", priceFrom: 2000 }] },
  17: { total: 2, spaces: [{ name: "Řepy Center", address: "Makovského 1", priceFrom: 2200 }] },
  18: { total: 3, spaces: [{ name: "Letňany Business", address: "Veselská 24", priceFrom: 2500 }] },
  19: { total: 1, spaces: [{ name: "Kbely Office", address: "Toužimská 1", priceFrom: 2000 }] },
  20: { total: 2, spaces: [{ name: "Horní Počernice Hub", address: "Náchodská 2", priceFrom: 2200 }] },
  21: { total: 1, spaces: [{ name: "Újezd Workspace", address: "Starokolínská 1", priceFrom: 2000 }] },
  22: { total: 2, spaces: [{ name: "Uhříněves Office", address: "Přátelství 1", priceFrom: 2200 }] },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `coworking-${districtId}`;

  const cached = getCached<CoworkingData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CoworkingData>);
  }

  const data = COWORKING_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<CoworkingData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<CoworkingData>);
}
