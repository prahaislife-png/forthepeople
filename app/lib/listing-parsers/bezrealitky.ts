/**
 * Bezrealitky.cz listing parser.
 * Extracts property details from Bezrealitky listing pages.
 */

import type { ListingDetails } from "../services-types";
import {
  parseCzechPrice, parseArea, parseRooms, parseFloor,
  parseCondition, parseBuildingType, extractDistrictId,
  hasElevator, extractYearBuilt, parseEnergyClass, parseOwnership,
} from "./common";

/** Bezrealitky uses structured data in their pages. Parse from raw text. */
export function parseBezrealitkyRawText(text: string, url: string): ListingDetails {
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

    // Bezrealitky titles often have format "Prodej bytu 2+kk 54 m²"
    if (!title && line.match(/prodej\s+bytu/i)) {
      title = line;
      rooms = parseRooms(line);
      const area = parseArea(line);
      if (area > 0) areaM2 = area;
    }

    // Price — look for main price
    if (line.match(/[\d\s]+(?:Kč|CZK)/) && !line.match(/měsíc|month|poplatek|fees/i)) {
      const price = parseCzechPrice(line);
      if (price > 500000 && (!priceTotal || price > priceTotal)) priceTotal = price;
    }

    // Area from parameters
    if (line.match(/užitná\s+plocha|celková\s+plocha|plocha\s+bytu/i)) {
      const area = parseArea(line + " " + (lines[i + 1] || ""));
      if (area > 0) areaM2 = area;
    }

    // Floor
    if (line.match(/podlaží|patro|floor/i)) {
      const parsed = parseFloor(line);
      if (parsed.floor > 0) {
        floor = parsed.floor;
        totalFloors = parsed.totalFloors;
      }
    }

    // Condition
    if (line.match(/stav/i) && line.length < 80) {
      condition = parseCondition(line);
    }

    // Building type
    if (line.match(/typ\s+(budovy|domu|stavby)/i) || line.match(/panelový|cihlový/i)) {
      buildingType = parseBuildingType(line);
    }

    // District/address
    if (line.match(/praha/i) && line.length < 120 && !districtText) {
      districtText = line;
    }

    // Description section (usually longer paragraphs)
    if (line.length > 150 && !description) {
      description = line;
    }
  }

  const districtId = extractDistrictId(districtText || url);
  if (!rooms) rooms = parseRooms(title || url);

  // Fallback: extract from URL path for bezrealitky
  // URL pattern: /nemovitosti-byty-domy/XXXXX-prodej-bytu-2kk-54
  if (!rooms) {
    const urlMatch = url.match(/(\d)\+?(?:kk|\d)/i);
    if (urlMatch) rooms = urlMatch[0].toLowerCase();
  }

  return {
    url,
    source: "bezrealitky",
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
    description: description || lines.slice(0, 30).join(" "),
    hasElevator: hasElevator(lines.join(" ")),
    yearBuilt: extractYearBuilt(lines.join(" ")),
    energyClass: parseEnergyClass(lines.join(" ")),
    ownership: parseOwnership(lines.join(" ")),
  };
}
