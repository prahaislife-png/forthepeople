/**
 * Shared parsing utilities for Czech real estate listing sites.
 * Handles Czech-specific number formats, room notation, and condition mapping.
 */

import type { ListingDetails } from "../services-types";

/** Detect which source a listing URL belongs to */
export function detectSource(url: string): ListingDetails["source"] {
  const hostname = new URL(url).hostname.replace("www.", "");
  if (hostname.includes("sreality.cz")) return "sreality";
  if (hostname.includes("bezrealitky.cz")) return "bezrealitky";
  if (hostname.includes("flatzone.cz")) return "flatzone";
  if (hostname.includes("idnes.cz")) return "idnes";
  return "other";
}

/** Parse Czech formatted prices: "4 850 000 Kč" → 4850000 */
export function parseCzechPrice(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/** Parse area strings: "54 m²", "54,5 m²" → 54 or 54.5 */
export function parseArea(raw: string): number {
  const match = raw.match(/([\d,.\s]+)\s*m/);
  if (!match) return 0;
  return parseFloat(match[1].replace(",", ".").replace(/\s/g, ""));
}

/** Parse Czech room notation: "2+kk" → "2+kk", "3+1" → "3+1" */
export function parseRooms(raw: string): string {
  const match = raw.match(/(\d\+(?:kk|\d))/i);
  return match ? match[1].toLowerCase() : raw.trim();
}

/** Parse floor info: "3. patro z 5", "3/5" → { floor: 3, totalFloors: 5 } */
export function parseFloor(raw: string): { floor: number; totalFloors: number } {
  // Pattern: "3. patro z 5" or "3. NP z 5"
  const patroMatch = raw.match(/(\d+)\.\s*(?:patro|np|podlaží)\s*(?:z|\/)\s*(\d+)/i);
  if (patroMatch) return { floor: parseInt(patroMatch[1]), totalFloors: parseInt(patroMatch[2]) };

  // Pattern: "3/5" or "3 / 5"
  const slashMatch = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) return { floor: parseInt(slashMatch[1]), totalFloors: parseInt(slashMatch[2]) };

  // Single number
  const numMatch = raw.match(/(\d+)/);
  if (numMatch) return { floor: parseInt(numMatch[1]), totalFloors: 0 };

  return { floor: 0, totalFloors: 0 };
}

/** Map Czech condition terms to standard values */
export function parseCondition(raw: string): ListingDetails["condition"] {
  const lower = raw.toLowerCase();
  if (lower.includes("novostavba") || lower.includes("nový") || lower.includes("developer")) return "new";
  if (lower.includes("po rekonstrukci") || lower.includes("rekonstruo") || lower.includes("revitali")) return "renovated";
  if (lower.includes("dobrý") || lower.includes("udržovaný") || lower.includes("velmi dobrý")) return "good";
  if (lower.includes("před rekonstrukcí") || lower.includes("k rekonstrukci") || lower.includes("špatný")) return "to_renovate";
  if (lower.includes("původní")) return "original";
  return "good"; // default assumption
}

/** Detect building type from description/parameters */
export function parseBuildingType(raw: string): ListingDetails["buildingType"] {
  const lower = raw.toLowerCase();
  if (lower.includes("panel") || lower.includes("panelák") || lower.includes("panelový")) return "panel";
  if (lower.includes("cihla") || lower.includes("cihlový") || lower.includes("cihelný")) return "brick";
  return "other";
}

/** Try to extract district ID from address/district text */
export function extractDistrictId(text: string): number {
  // Match "Praha X" or "Praha-X" or "Prague X"
  const match = text.match(/[Pp]rah[ae][\s\-]*(\d{1,2})/);
  if (match) return parseInt(match[1]);

  // Known neighborhood → district mapping
  const neighborhoods: Record<string, number> = {
    "holešovice": 7, "letná": 7, "bubeneč": 7, "troja": 7,
    "vinohrady": 2, "nové město": 1, "staré město": 1,
    "žižkov": 3, "karlín": 8, "libeň": 8,
    "smíchov": 5, "nusle": 4, "podolí": 4,
    "dejvice": 6, "břevnov": 6, "střešovice": 6,
    "vršovice": 10, "strašnice": 10, "záběhlice": 10,
    "chodov": 11, "háje": 11, "jižní město": 11,
    "modřany": 12, "libuš": 12, "kamýk": 12,
    "stodůlky": 13, "lužiny": 13, "řeporyje": 13,
    "černý most": 14, "hloubětín": 14, "kyje": 14,
    "prosek": 9, "letňany": 9, "vysočany": 9,
    "řepy": 17, "zličín": 17,
    "hostivař": 15, "dolní měcholupy": 15,
    "radotín": 16, "zbraslav": 16,
    "barrandov": 5, "hlubočepy": 5,
    "kunratice": 4, "krč": 4, "braník": 4,
    "kobylisy": 8, "bohnice": 8, "ďáblice": 8,
  };

  const lower = text.toLowerCase();
  for (const [neighborhood, id] of Object.entries(neighborhoods)) {
    if (lower.includes(neighborhood)) return id;
  }

  return 0;
}

/** Check if description mentions elevator */
export function hasElevator(text: string): boolean | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("výtah") || lower.includes("elevator") || lower.includes("s výtahem")) return true;
  if (lower.includes("bez výtahu") || lower.includes("without elevator")) return false;
  return undefined;
}

/** Try to extract year built from text */
export function extractYearBuilt(text: string): number | undefined {
  // Look for patterns like "rok výstavby 1975" or "postaven v roce 1980"
  const match = text.match(/(?:rok\s+výstavby|postaven[aáo]?\s+v?\s*(?:roce)?|built\s+in)\s*:?\s*(\d{4})/i);
  if (match) {
    const year = parseInt(match[1]);
    if (year >= 1850 && year <= 2026) return year;
  }
  // Also check for standalone 4-digit years that look like build dates (1950-2026)
  const yearMatches = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/g);
  if (yearMatches && yearMatches.length === 1) {
    return parseInt(yearMatches[0]);
  }
  return undefined;
}

/** Parse energy class: "C" from "Třída energetické náročnosti: C" */
export function parseEnergyClass(text: string): string | undefined {
  const match = text.match(/(?:energetick[áé]\s+(?:náročnost|třída)|energy\s+class)\s*:?\s*([A-G])/i);
  return match ? match[1].toUpperCase() : undefined;
}

/** Detect ownership type from Czech parameters */
export function parseOwnership(text: string): ListingDetails["ownership"] | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("osobní vlastnictví") || lower.includes("osobní")) return "personal";
  if (lower.includes("družstevní") || lower.includes("družstvo")) return "cooperative";
  return undefined;
}
