/**
 * Renovation cost estimator for Czech real estate.
 * Provides estimates based on property condition and area.
 * Prices calibrated to Prague market (2024-2025).
 */

import type { ListingDetails } from "../services-types";

export interface RenovationEstimate {
  needed: boolean;
  estimatedCostCZK: number;
  items: { item: string; itemCz: string; cost: number }[];
}

/** Standard renovation costs in CZK for Prague (2024-2025 prices) */
const RENOVATION_COSTS = {
  bathroom: { base: 180_000, perM2: 25_000, label: "Bathroom renovation", labelCz: "Rekonstrukce koupelny" },
  kitchen: { base: 120_000, perM2: 15_000, label: "Kitchen renovation", labelCz: "Rekonstrukce kuchyně" },
  flooring: { perM2: 1_500, label: "Flooring replacement", labelCz: "Výměna podlah" },
  electrical: { perM2: 2_000, label: "Electrical rewiring", labelCz: "Elektroinstalace" },
  plumbing: { base: 80_000, label: "Plumbing update", labelCz: "Rozvody vody" },
  windows: { perWindow: 25_000, label: "Window replacement", labelCz: "Výměna oken" },
  painting: { perM2: 350, label: "Painting & walls", labelCz: "Malování a stěny" },
  heating: { perM2: 1_200, label: "Heating system", labelCz: "Topení" },
};

/**
 * Estimate renovation costs based on property condition.
 */
export function estimateRenovation(listing: ListingDetails): RenovationEstimate {
  const { condition, areaM2 } = listing;
  const desc = listing.description.toLowerCase();

  // No renovation needed for new/renovated properties
  if (condition === "new" || condition === "renovated") {
    return { needed: false, estimatedCostCZK: 0, items: [] };
  }

  const items: RenovationEstimate["items"] = [];
  const estimatedWindows = Math.max(2, Math.ceil(areaM2 / 15)); // ~1 window per 15m²

  if (condition === "to_renovate") {
    // Full renovation scope
    items.push({
      item: RENOVATION_COSTS.bathroom.label,
      itemCz: RENOVATION_COSTS.bathroom.labelCz,
      cost: RENOVATION_COSTS.bathroom.base,
    });
    items.push({
      item: RENOVATION_COSTS.kitchen.label,
      itemCz: RENOVATION_COSTS.kitchen.labelCz,
      cost: RENOVATION_COSTS.kitchen.base,
    });
    items.push({
      item: RENOVATION_COSTS.flooring.label,
      itemCz: RENOVATION_COSTS.flooring.labelCz,
      cost: Math.round(areaM2 * RENOVATION_COSTS.flooring.perM2),
    });
    items.push({
      item: RENOVATION_COSTS.electrical.label,
      itemCz: RENOVATION_COSTS.electrical.labelCz,
      cost: Math.round(areaM2 * RENOVATION_COSTS.electrical.perM2),
    });
    items.push({
      item: RENOVATION_COSTS.plumbing.label,
      itemCz: RENOVATION_COSTS.plumbing.labelCz,
      cost: RENOVATION_COSTS.plumbing.base,
    });
    items.push({
      item: RENOVATION_COSTS.windows.label,
      itemCz: RENOVATION_COSTS.windows.labelCz,
      cost: estimatedWindows * RENOVATION_COSTS.windows.perWindow,
    });
    items.push({
      item: RENOVATION_COSTS.painting.label,
      itemCz: RENOVATION_COSTS.painting.labelCz,
      cost: Math.round(areaM2 * 2.5 * RENOVATION_COSTS.painting.perM2), // walls ~2.5x floor area
    });
  } else if (condition === "original") {
    // Partial renovation — modernize key areas
    items.push({
      item: RENOVATION_COSTS.bathroom.label,
      itemCz: RENOVATION_COSTS.bathroom.labelCz,
      cost: RENOVATION_COSTS.bathroom.base,
    });
    items.push({
      item: RENOVATION_COSTS.flooring.label,
      itemCz: RENOVATION_COSTS.flooring.labelCz,
      cost: Math.round(areaM2 * RENOVATION_COSTS.flooring.perM2),
    });
    items.push({
      item: RENOVATION_COSTS.painting.label,
      itemCz: RENOVATION_COSTS.painting.labelCz,
      cost: Math.round(areaM2 * 2.5 * RENOVATION_COSTS.painting.perM2),
    });

    // Add electrical if old building
    if (listing.yearBuilt && listing.yearBuilt < 1980) {
      items.push({
        item: RENOVATION_COSTS.electrical.label,
        itemCz: RENOVATION_COSTS.electrical.labelCz,
        cost: Math.round(areaM2 * RENOVATION_COSTS.electrical.perM2),
      });
    }
  } else if (condition === "good") {
    // Minor cosmetic updates only
    if (desc.match(/původní koupelna|starší koupelna/)) {
      items.push({
        item: RENOVATION_COSTS.bathroom.label,
        itemCz: RENOVATION_COSTS.bathroom.labelCz,
        cost: RENOVATION_COSTS.bathroom.base,
      });
    }
    items.push({
      item: RENOVATION_COSTS.painting.label,
      itemCz: RENOVATION_COSTS.painting.labelCz,
      cost: Math.round(areaM2 * 2.5 * RENOVATION_COSTS.painting.perM2),
    });
  }

  const estimatedCostCZK = items.reduce((sum, i) => sum + i.cost, 0);

  return {
    needed: estimatedCostCZK > 0,
    estimatedCostCZK,
    items,
  };
}
