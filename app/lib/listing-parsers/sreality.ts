/**
 * SReality.cz listing parser.
 * Extracts property details from SReality listing pages crawled via Apify.
 */

import type { ListingDetails } from "../services-types";
import {
  parseCzechPrice, parseArea, parseRooms, parseFloor,
  parseCondition, parseBuildingType, extractDistrictId,
  hasElevator, extractYearBuilt, parseEnergyClass, parseOwnership,
} from "./common";

/** Output shape from bebich/sreality-scraper actor */
export interface SrealityScraperOutput {
  url?: string;
  title?: string;
  price?: string | number;
  locality?: string;
  description?: string;
  images?: string[];
  // Parameter map (from the listing details table)
  params?: Record<string, string>;
  // Alternative: raw text content from website-content-crawler
  text?: string;
}

/** Parse a SReality listing from the dedicated scraper actor output */
export function parseSrealityActor(item: SrealityScraperOutput, url: string): ListingDetails {
  const params = item.params || {};
  const description = item.description || "";
  const allText = `${description} ${Object.values(params).join(" ")}`;

  const priceTotal = typeof item.price === "number"
    ? item.price
    : parseCzechPrice(String(item.price || params["Celková cena"] || "0"));

  const areaRaw = params["Užitná plocha"] || params["Plocha"] || params["Podlahová plocha"] || "";
  const areaM2 = parseArea(areaRaw);

  const roomsRaw = params["Dispozice"] || item.title || "";
  const rooms = parseRooms(roomsRaw);

  const floorRaw = params["Podlaží"] || "";
  const { floor, totalFloors } = parseFloor(floorRaw);

  const conditionRaw = params["Stav objektu"] || params["Stav"] || "";
  const condition = parseCondition(conditionRaw || allText);

  const buildingTypeRaw = params["Stavba"] || params["Typ budovy"] || "";
  const buildingType = parseBuildingType(buildingTypeRaw || allText);

  const districtText = item.locality || item.title || "";
  const districtId = extractDistrictId(districtText);

  const photos = item.images || [];

  return {
    url,
    source: "sreality",
    title: item.title || `${rooms} flat, ${areaM2} m²`,
    priceTotal,
    pricePerM2: areaM2 > 0 ? Math.round(priceTotal / areaM2) : 0,
    areaM2,
    floor,
    totalFloors,
    condition,
    buildingType,
    district: districtText,
    districtId,
    rooms,
    photos,
    photoCount: photos.length,
    description,
    address: item.locality,
    hasElevator: hasElevator(allText) ?? (params["Výtah"] === "Ano" ? true : params["Výtah"] === "Ne" ? false : undefined),
    yearBuilt: extractYearBuilt(allText),
    energyClass: parseEnergyClass(allText),
    ownership: parseOwnership(params["Vlastnictví"] || allText),
  };
}

/** Parse SReality listing from website-content-crawler raw text output */
export function parseSrealityRawText(text: string, url: string): ListingDetails {
  // Extract key fields from raw page text using Czech patterns
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let title = "";
  let priceTotal = 0;
  let areaM2 = 0;
  let rooms = "";
  let floor = 0;
  let totalFloors = 0;
  let condition: ListingDetails["condition"] = "good";
  let buildingType: ListingDetails["buildingType"] = "other";
  let districtText = "";
  let description = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Title is typically the first meaningful line
    if (!title && line.match(/\d\+(?:kk|\d)/) && line.length < 200) {
      title = line;
      rooms = parseRooms(line);
    }

    // Price patterns
    if (line.match(/celková cena/i) || line.match(/[\d\s]+(?:Kč|CZK)/)) {
      const price = parseCzechPrice(line);
      if (price > 100000) priceTotal = price;
    }

    // Area patterns
    if (line.match(/užitná plocha|plocha|podlahová/i)) {
      const area = parseArea(line);
      if (area > 0) areaM2 = area;
    }

    // Floor
    if (line.match(/podlaží/i)) {
      const parsed = parseFloor(line);
      floor = parsed.floor;
      totalFloors = parsed.totalFloors;
    }

    // Condition
    if (line.match(/stav\s*(objektu|budovy)?/i)) {
      condition = parseCondition(line);
    }

    // Building type
    if (line.match(/stavba|typ budovy/i)) {
      buildingType = parseBuildingType(line);
    }

    // Locality/district
    if (line.match(/praha/i) && line.length < 100 && !districtText) {
      districtText = line;
    }
  }

  // Build description from remaining text
  description = lines.slice(0, 50).join(" ");

  const districtId = extractDistrictId(districtText || url);
  if (!rooms) rooms = parseRooms(title || url);

  return {
    url,
    source: "sreality",
    title: title || `Property in Praha ${districtId}`,
    priceTotal,
    pricePerM2: areaM2 > 0 ? Math.round(priceTotal / areaM2) : 0,
    areaM2,
    floor,
    totalFloors,
    condition,
    buildingType,
    district: districtText || `Praha ${districtId}`,
    districtId,
    rooms,
    photos: [],
    photoCount: 0,
    description,
    hasElevator: hasElevator(description),
    yearBuilt: extractYearBuilt(description),
    energyClass: parseEnergyClass(description),
    ownership: parseOwnership(description),
  };
}
