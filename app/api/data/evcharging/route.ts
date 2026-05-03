import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, persistData, type LiveResponse } from "@/app/lib/cache";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

export interface EVChargingData {
  total: number;
  available: number;
  stations: Array<{ name: string; address: string; connectors: number; powerKW: number; operator: string; status: string }>;
  fastChargers: number;
  source: string;
}

const SOURCE = "https://api.openchargemap.io/v3/poi";
const CACHE_TTL = 60 * 60 * 1000;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateFallback(districtId: number): EVChargingData {
  const rand = seededRandom(districtId * 8291);
  const total = 4 + Math.round(rand() * 12);
  const operators = ["PRE", "ČEZ", "E.ON", "Ionity", "Shell Recharge", "Orlen Charge"];
  const streets = [
    "Milady Horákové", "Argentinská", "Komunardů", "Bubenská",
    "Veletržní", "Dukelských hrdinů", "Plynární", "Tusarova",
    "Jateční", "Dělnická", "U Průhonu", "Heřmanova",
  ];

  const stations: EVChargingData["stations"] = [];
  let fastCount = 0;
  let availableCount = 0;

  for (let i = 0; i < Math.min(8, total); i++) {
    const powerKW = rand() > 0.7 ? (50 + Math.round(rand() * 300)) : (7 + Math.round(rand() * 15));
    if (powerKW >= 50) fastCount++;
    const isAvailable = rand() > 0.3;
    if (isAvailable) availableCount++;
    stations.push({
      name: `EV Station P${districtId}-${i + 1}`,
      address: `${streets[i % streets.length]} ${Math.round(rand() * 50)}`,
      connectors: 1 + Math.round(rand() * 3),
      powerKW,
      operator: operators[Math.floor(rand() * operators.length)],
      status: isAvailable ? "Available" : "In use",
    });
  }

  return {
    total,
    available: availableCount,
    stations,
    fastChargers: fastCount,
    source: SOURCE,
  };
}

interface OCMResult {
  AddressInfo?: { Title?: string; AddressLine1?: string; Town?: string };
  Connections?: Array<{ PowerKW?: number; StatusType?: { Title?: string } }>;
  OperatorInfo?: { Title?: string };
  StatusType?: { Title?: string };
  NumberOfPoints?: number;
}

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<EVChargingData | null>);
  }

  const cacheKey = `evcharging-${districtId}`;
  const cached = getCached<EVChargingData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<EVChargingData>);
  }

  const persisted = await getPersistedData<EVChargingData>(districtId, "evcharging");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<EVChargingData>);
  }

  try {
    const url = `https://api.openchargemap.io/v3/poi?output=json&countrycode=CZ&latitude=${coords.lat}&longitude=${coords.lng}&distance=4&distanceunit=KM&maxresults=20&compact=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OpenChargeMap ${res.status}`);
    const json = await res.json() as OCMResult[];

    let fastChargers = 0;
    let available = 0;
    const stations: EVChargingData["stations"] = [];

    for (const poi of json.slice(0, 10)) {
      const maxPower = Math.max(...(poi.Connections?.map(c => c.PowerKW || 0) || [0]));
      if (maxPower >= 50) fastChargers++;
      const status = poi.StatusType?.Title || "Unknown";
      if (status.toLowerCase().includes("operational") || status.toLowerCase().includes("available")) available++;

      stations.push({
        name: poi.AddressInfo?.Title || "EV Station",
        address: poi.AddressInfo?.AddressLine1 || poi.AddressInfo?.Town || "",
        connectors: poi.NumberOfPoints || poi.Connections?.length || 1,
        powerKW: maxPower,
        operator: poi.OperatorInfo?.Title || "Unknown",
        status: status.includes("Operational") ? "Available" : status,
      });
    }

    const data: EVChargingData = { total: json.length, available, stations, fastChargers, source: SOURCE };
    setCache(cacheKey, data);
    await persistData(districtId, "evcharging", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<EVChargingData>);
  } catch {
    const data = generateFallback(districtId);
    setCache(cacheKey, data);
    return Response.json({ status: "demo", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<EVChargingData>);
  }
}
