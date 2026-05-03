import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, persistData, type LiveResponse } from "@/app/lib/cache";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";

export interface NoiseSensorData {
  sensors: Array<{ id: string; name: string; location: string; currentDb: number; avgDb: number; status: string }>;
  districtAvgDb: number;
  exceedances24h: number;
  peakHour: string;
  peakDb: number;
  source: string;
}

const SOURCE = "https://www.geoportalpraha.cz";
const CACHE_TTL = 30 * 60 * 1000;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateFallback(districtId: number): NoiseSensorData {
  const rand = seededRandom(districtId * 6131 + Date.now() % 10000);
  const baseDb = districtId <= 5 ? 62 : districtId <= 12 ? 56 : 50;

  const sensorNames = [
    "Hlavní třída", "Nám. Republiky", "U Metra", "Školní ulice",
    "Nádražní", "Park Stromovka", "Obchodní centrum", "Křižovatka",
  ];
  const locations = [
    "Main intersection", "Near metro station", "Residential block",
    "School zone", "Commercial strip", "Park boundary", "Highway overpass",
    "Rail crossing",
  ];

  const sensorCount = 3 + Math.round(rand() * 4);
  const sensors: NoiseSensorData["sensors"] = [];
  let totalDb = 0;

  for (let i = 0; i < sensorCount; i++) {
    const currentDb = Math.round(baseDb + (rand() - 0.3) * 15);
    const avgDb = Math.round(baseDb + (rand() - 0.5) * 8);
    totalDb += currentDb;
    sensors.push({
      id: `NS-${districtId}-${i + 1}`,
      name: sensorNames[i % sensorNames.length],
      location: locations[i % locations.length],
      currentDb,
      avgDb,
      status: currentDb > 70 ? "warning" : "normal",
    });
  }

  const peakHours = ["07:30", "08:15", "16:45", "17:30", "18:00", "22:00"];

  return {
    sensors,
    districtAvgDb: Math.round(totalDb / sensorCount),
    exceedances24h: Math.round(rand() * 8),
    peakHour: peakHours[Math.floor(rand() * peakHours.length)],
    peakDb: Math.round(baseDb + 10 + rand() * 12),
    source: SOURCE,
  };
}

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<NoiseSensorData | null>);
  }

  const cacheKey = `noisesensors-${districtId}`;
  const cached = getCached<NoiseSensorData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<NoiseSensorData>);
  }

  const persisted = await getPersistedData<NoiseSensorData>(districtId, "noisesensors");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<NoiseSensorData>);
  }

  try {
    const url = `https://geoportalpraha.cz/api/noise-sensors?lat=${coords.lat}&lng=${coords.lng}&radius=3000`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Geoportal API ${res.status}`);
    const json = await res.json() as Array<{ id: string; name: string; location: string; current_db: number; avg_db: number }>;

    const sensors = json.slice(0, 8).map(s => ({
      id: s.id,
      name: s.name,
      location: s.location,
      currentDb: s.current_db,
      avgDb: s.avg_db,
      status: s.current_db > 70 ? "warning" : "normal",
    }));

    const districtAvgDb = sensors.length > 0 ? Math.round(sensors.reduce((s, x) => s + x.currentDb, 0) / sensors.length) : 55;
    const peak = sensors.reduce((max, s) => s.currentDb > max.currentDb ? s : max, sensors[0]);

    const data: NoiseSensorData = { sensors, districtAvgDb, exceedances24h: sensors.filter(s => s.currentDb > 65).length, peakHour: new Date().getHours() + ":00", peakDb: peak?.currentDb ?? 60, source: SOURCE };
    setCache(cacheKey, data);
    await persistData(districtId, "noisesensors", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<NoiseSensorData>);
  } catch {
    const data = generateFallback(districtId);
    setCache(cacheKey, data);
    return Response.json({ status: "demo", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<NoiseSensorData>);
  }
}
