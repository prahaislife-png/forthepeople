/**
 * Red flags engine for Czech real estate listings.
 * Rule-based system that scans listing data + district context for potential issues.
 */

import type { ListingDetails } from "../services-types";

export interface RedFlag {
  severity: "low" | "medium" | "high";
  category: string;
  description: string;
  descriptionCz: string;
}

interface RedFlagContext {
  noiseAvgDb?: number;
  airQualityAqi?: number;
  crimePerCapita?: number;
  cityAvgCrimePerCapita?: number;
  districtAvgPriceM2?: number;
}

/**
 * Generate red flags based on listing details and district context.
 * Returns flags sorted by severity (high first).
 */
export function generateRedFlags(listing: ListingDetails, ctx: RedFlagContext): RedFlag[] {
  const flags: RedFlag[] = [];
  const desc = listing.description.toLowerCase();
  const allText = `${listing.description} ${listing.title}`.toLowerCase();

  // === BUILDING & STRUCTURAL FLAGS ===

  // Panel building (panelák) — common in Prague, lower quality
  if (listing.buildingType === "panel") {
    flags.push({
      severity: "low",
      category: "building",
      description: "Panel building (panelák) — typically lower build quality, may have insulation issues",
      descriptionCz: "Panelový dům — nižší kvalita stavby, možné problémy se zateplením",
    });
  }

  // Old building without insulation
  if (listing.yearBuilt && listing.yearBuilt < 1990 && !allText.includes("zateplen")) {
    flags.push({
      severity: "high",
      category: "energy",
      description: `Building from ${listing.yearBuilt} with no insulation mentioned — expect high energy costs`,
      descriptionCz: `Budova z roku ${listing.yearBuilt} bez zmínky o zateplení — očekávejte vysoké náklady na energie`,
    });
  }

  // High floor without elevator
  if (listing.floor > 3 && listing.hasElevator === false) {
    flags.push({
      severity: "medium",
      category: "convenience",
      description: `Floor ${listing.floor} without elevator — impacts resale value and daily comfort`,
      descriptionCz: `${listing.floor}. patro bez výtahu — ovlivňuje cenu při prodeji a komfort`,
    });
  }

  // Ground floor
  if (listing.floor === 1) {
    flags.push({
      severity: "low",
      category: "security",
      description: "Ground floor apartment — higher noise, less privacy, potential security concerns",
      descriptionCz: "Byt v přízemí — vyšší hluk, méně soukromí, možné bezpečnostní obavy",
    });
  }

  // Needs renovation
  if (listing.condition === "to_renovate") {
    flags.push({
      severity: "high",
      category: "cost",
      description: "Property needs renovation — budget an additional 200,000-800,000 Kč depending on scope",
      descriptionCz: "Nemovitost vyžaduje rekonstrukci — počítejte s dalšími 200 000-800 000 Kč",
    });
  }

  // Cooperative ownership
  if (listing.ownership === "cooperative") {
    flags.push({
      severity: "medium",
      category: "legal",
      description: "Cooperative ownership (družstevní) — harder to get a mortgage, transfer fees apply",
      descriptionCz: "Družstevní vlastnictví — obtížnější hypotéka, převodní poplatky",
    });
  }

  // === PRICE FLAGS ===

  // Price significantly above district average
  if (ctx.districtAvgPriceM2 && listing.pricePerM2 > 0) {
    const pctAbove = ((listing.pricePerM2 - ctx.districtAvgPriceM2) / ctx.districtAvgPriceM2) * 100;
    if (pctAbove > 25) {
      flags.push({
        severity: "high",
        category: "price",
        description: `Price is ${Math.round(pctAbove)}% above district average (${ctx.districtAvgPriceM2.toLocaleString()} Kč/m²) — significantly overpriced`,
        descriptionCz: `Cena je ${Math.round(pctAbove)} % nad průměrem čtvrti (${ctx.districtAvgPriceM2.toLocaleString()} Kč/m²) — výrazně předraženo`,
      });
    } else if (pctAbove > 15) {
      flags.push({
        severity: "medium",
        category: "price",
        description: `Price is ${Math.round(pctAbove)}% above district average — somewhat above market`,
        descriptionCz: `Cena je ${Math.round(pctAbove)} % nad průměrem čtvrti — mírně nad trhem`,
      });
    }
  }

  // === LISTING QUALITY FLAGS ===

  // Very few photos
  if (listing.photoCount > 0 && listing.photoCount < 5) {
    flags.push({
      severity: "medium",
      category: "transparency",
      description: `Only ${listing.photoCount} photos — sellers with quality properties usually show more`,
      descriptionCz: `Pouze ${listing.photoCount} fotografií — prodejci kvalitních nemovitostí obvykle ukazují více`,
    });
  }

  // No photos at all
  if (listing.photoCount === 0) {
    flags.push({
      severity: "high",
      category: "transparency",
      description: "No photos available — major red flag, property may have undisclosed issues",
      descriptionCz: "Žádné fotografie — závažný varovný signál, nemovitost může mít nesdělené problémy",
    });
  }

  // Urgent language in description
  if (desc.match(/rychlý prodej|ihned|urgent|nutný prodej|za každou cenu|sleva jen do/)) {
    flags.push({
      severity: "medium",
      category: "motivation",
      description: "Urgent sale language detected — seller may be under pressure (opportunity or hidden issues)",
      descriptionCz: "Detekován naléhavý jazyk prodeje — prodávající může být pod tlakem",
    });
  }

  // Very short description
  if (listing.description.length < 100) {
    flags.push({
      severity: "low",
      category: "transparency",
      description: "Very short description — limited information about the property",
      descriptionCz: "Velmi krátký popis — omezené informace o nemovitosti",
    });
  }

  // North-facing mention
  if (desc.match(/sever|severní orientace|north[\s-]facing/)) {
    flags.push({
      severity: "low",
      category: "comfort",
      description: "North-facing orientation mentioned — less natural light throughout the day",
      descriptionCz: "Zmíněna severní orientace — méně denního světla",
    });
  }

  // === ENVIRONMENTAL FLAGS ===

  // High noise
  if (ctx.noiseAvgDb && ctx.noiseAvgDb > 65) {
    flags.push({
      severity: "medium",
      category: "environment",
      description: `District noise level ${ctx.noiseAvgDb}dB — above WHO residential limit (55dB)`,
      descriptionCz: `Hladina hluku v čtvrti ${ctx.noiseAvgDb}dB — nad doporučením WHO (55dB)`,
    });
  }

  // Poor air quality
  if (ctx.airQualityAqi && ctx.airQualityAqi > 60) {
    flags.push({
      severity: "medium",
      category: "environment",
      description: `Air quality index (AQI) is ${ctx.airQualityAqi} — moderate to poor, may affect health`,
      descriptionCz: `Index kvality ovzduší (AQI) je ${ctx.airQualityAqi} — střední až špatná kvalita`,
    });
  }

  // High crime area
  if (ctx.crimePerCapita && ctx.cityAvgCrimePerCapita && ctx.crimePerCapita > ctx.cityAvgCrimePerCapita * 1.3) {
    flags.push({
      severity: "medium",
      category: "safety",
      description: "Crime rate 30%+ above city average — consider personal safety factors",
      descriptionCz: "Míra kriminality 30 %+ nad průměrem města — zvažte faktor bezpečnosti",
    });
  }

  // Sort by severity: high > medium > low
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return flags;
}
