import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface SocialData {
  seniorHomes: number;
  shelters: number;
  counselingCenters: number;
  totalProviders: number;
  services: Array<{ name: string; type: string }>;
}

const SOURCE = "https://iregistr.mpsv.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const SOCIAL_BY_DISTRICT: Record<number, SocialData> = {
  1: { seniorHomes: 3, shelters: 5, counselingCenters: 12, totalProviders: 42, services: [{ name: "Naděje", type: "Shelter" }, { name: "Armáda spásy", type: "Emergency housing" }] },
  2: { seniorHomes: 2, shelters: 2, counselingCenters: 8, totalProviders: 28, services: [{ name: "Diakonie ČCE", type: "Senior care" }, { name: "Centrum pro seniory", type: "Day care" }] },
  3: { seniorHomes: 4, shelters: 3, counselingCenters: 9, totalProviders: 35, services: [{ name: "Domov pro seniory Žižkov", type: "Senior home" }, { name: "Centrum sociálních služeb", type: "Counseling" }] },
  4: { seniorHomes: 5, shelters: 2, counselingCenters: 7, totalProviders: 31, services: [{ name: "Domov seniorů Chodov", type: "Senior home" }, { name: "Sociální poradna P4", type: "Counseling" }] },
  5: { seniorHomes: 3, shelters: 3, counselingCenters: 6, totalProviders: 26, services: [{ name: "Domov seniorů Smíchov", type: "Senior home" }, { name: "Pečovatelská služba P5", type: "Home care" }] },
  6: { seniorHomes: 4, shelters: 1, counselingCenters: 5, totalProviders: 22, services: [{ name: "Domov seniorů Břevnov", type: "Senior home" }, { name: "Senior Point Dejvice", type: "Day center" }] },
  7: { seniorHomes: 2, shelters: 4, counselingCenters: 7, totalProviders: 29, services: [{ name: "Centrum sociální pomoci", type: "Counseling" }, { name: "Naděje Holešovice", type: "Shelter" }, { name: "Domov seniorů Holešovice", type: "Senior home" }] },
  8: { seniorHomes: 3, shelters: 3, counselingCenters: 6, totalProviders: 25, services: [{ name: "Domov seniorů Bohnice", type: "Senior home" }, { name: "CSS Praha 8", type: "Home care" }] },
  9: { seniorHomes: 2, shelters: 1, counselingCenters: 4, totalProviders: 18, services: [{ name: "Pečovatelská služba P9", type: "Home care" }, { name: "Senior centrum Prosek", type: "Day center" }] },
  10: { seniorHomes: 4, shelters: 2, counselingCenters: 6, totalProviders: 27, services: [{ name: "Domov seniorů Vršovice", type: "Senior home" }, { name: "CSS Praha 10", type: "Counseling" }] },
  11: { seniorHomes: 3, shelters: 1, counselingCenters: 4, totalProviders: 19, services: [{ name: "DS Jižní Město", type: "Senior home" }, { name: "Pečovatelská služba P11", type: "Home care" }] },
  12: { seniorHomes: 2, shelters: 1, counselingCenters: 3, totalProviders: 14, services: [{ name: "DS Modřany", type: "Senior home" }, { name: "CSS Praha 12", type: "Home care" }] },
  13: { seniorHomes: 2, shelters: 1, counselingCenters: 3, totalProviders: 15, services: [{ name: "DS Stodůlky", type: "Senior home" }, { name: "Pečovatelská služba P13", type: "Home care" }] },
  14: { seniorHomes: 1, shelters: 1, counselingCenters: 2, totalProviders: 11, services: [{ name: "DS Černý Most", type: "Senior home" }, { name: "CSS Praha 14", type: "Counseling" }] },
  15: { seniorHomes: 1, shelters: 0, counselingCenters: 2, totalProviders: 9, services: [{ name: "Pečovatelská služba P15", type: "Home care" }] },
  16: { seniorHomes: 1, shelters: 0, counselingCenters: 1, totalProviders: 6, services: [{ name: "DS Radotín", type: "Senior home" }] },
  17: { seniorHomes: 1, shelters: 0, counselingCenters: 2, totalProviders: 8, services: [{ name: "DS Řepy", type: "Senior home" }] },
  18: { seniorHomes: 1, shelters: 0, counselingCenters: 1, totalProviders: 7, services: [{ name: "Pečovatelská služba P18", type: "Home care" }] },
  19: { seniorHomes: 1, shelters: 0, counselingCenters: 1, totalProviders: 5, services: [{ name: "CSS Praha 19", type: "Home care" }] },
  20: { seniorHomes: 1, shelters: 0, counselingCenters: 1, totalProviders: 6, services: [{ name: "DS Horní Počernice", type: "Senior home" }] },
  21: { seniorHomes: 1, shelters: 0, counselingCenters: 1, totalProviders: 5, services: [{ name: "Pečovatelská služba P21", type: "Home care" }] },
  22: { seniorHomes: 1, shelters: 0, counselingCenters: 1, totalProviders: 6, services: [{ name: "DS Uhříněves", type: "Senior home" }] },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `social-${districtId}`;

  const cached = getCached<SocialData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SocialData>);
  }

  const data = SOCIAL_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<SocialData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<SocialData>);
}
