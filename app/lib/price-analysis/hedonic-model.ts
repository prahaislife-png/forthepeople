/**
 * Hedonic pricing model for Czech real estate.
 * Computes a "fair price" based on district averages adjusted by property characteristics.
 *
 * Model: fairPrice = districtBasePrice × product(multipliers)
 * Calibrated for Prague market conditions (2024-2025 data).
 */

import type { ListingDetails } from "../services-types";

export interface HedonicFactors {
  condition: number;
  floor: number;
  noise: number;
  airQuality: number;
  crime: number;
  transit: number;
  buildingType: number;
  energyClass: number;
  size: number; // larger apartments have lower per-m2 price
}

export interface HedonicResult {
  fairPricePerM2: number;
  fairPriceTotal: number;
  factors: HedonicFactors;
  confidence: number; // 0-100 based on data completeness
  basePrice: number;  // district avg used
}

/** Multiplier tables calibrated for Prague (2024-2025) */
const CONDITION_MULTIPLIERS: Record<ListingDetails["condition"], number> = {
  new: 1.15,
  renovated: 1.05,
  good: 1.0,
  original: 0.90,
  to_renovate: 0.75,
};

const BUILDING_TYPE_MULTIPLIERS: Record<ListingDetails["buildingType"], number> = {
  brick: 1.04,
  panel: 0.94,
  other: 1.0,
};

/** Energy class multipliers (A is best, G is worst) */
const ENERGY_CLASS_MULTIPLIERS: Record<string, number> = {
  A: 1.04,
  B: 1.02,
  C: 1.0,
  D: 0.98,
  E: 0.96,
  F: 0.94,
  G: 0.92,
};

/**
 * Compute floor multiplier.
 * Ground floor = discount, mid-floors neutral, top floor with elevator = premium.
 */
function getFloorMultiplier(floor: number, totalFloors: number, hasElevator?: boolean): number {
  if (floor <= 0) return 1.0; // unknown

  // Ground floor
  if (floor === 1) return 0.95;

  // Top floor
  if (totalFloors > 0 && floor >= totalFloors) {
    return hasElevator !== false ? 1.05 : 0.97; // penthouse premium only with elevator
  }

  // High floor without elevator
  if (floor > 4 && hasElevator === false) return 0.93;

  // Mid floors (2-4) — neutral to slight premium
  if (floor >= 2 && floor <= 4) return 1.01;

  // Upper floors (5+) with elevator
  if (floor >= 5) return 1.03;

  return 1.0;
}

/**
 * Noise multiplier based on district average decibel level.
 * WHO recommends <55dB for residential. Prague avg is ~58dB.
 */
function getNoiseMultiplier(dayAvgDb: number): number {
  if (dayAvgDb <= 50) return 1.03;
  if (dayAvgDb <= 55) return 1.01;
  if (dayAvgDb <= 60) return 1.0;
  if (dayAvgDb <= 65) return 0.97;
  if (dayAvgDb <= 70) return 0.94;
  return 0.90; // >70dB is very noisy
}

/**
 * Air quality multiplier based on AQI.
 * AQI 0-25 is excellent, 26-50 good, 51-75 moderate, 76+ unhealthy.
 */
function getAirQualityMultiplier(aqi: number): number {
  if (aqi <= 20) return 1.03;
  if (aqi <= 35) return 1.01;
  if (aqi <= 50) return 1.0;
  if (aqi <= 65) return 0.98;
  if (aqi <= 80) return 0.96;
  return 0.93;
}

/**
 * Crime multiplier based on incidents per capita.
 * Lower crime = premium.
 */
function getCrimeMultiplier(crimePerCapita: number, cityAvgPerCapita: number): number {
  const ratio = crimePerCapita / cityAvgPerCapita;
  if (ratio <= 0.7) return 1.03;
  if (ratio <= 0.9) return 1.01;
  if (ratio <= 1.1) return 1.0;
  if (ratio <= 1.3) return 0.97;
  if (ratio <= 1.5) return 0.95;
  return 0.92;
}

/**
 * Transit accessibility multiplier.
 * Based on number of transit stops within the district.
 * Higher connectivity = premium.
 */
function getTransitMultiplier(transitScore: number): number {
  // transitScore: 0-100 (0 = poor, 100 = excellent metro access)
  if (transitScore >= 90) return 1.08;
  if (transitScore >= 75) return 1.05;
  if (transitScore >= 60) return 1.02;
  if (transitScore >= 40) return 1.0;
  if (transitScore >= 20) return 0.97;
  return 0.94;
}

/**
 * Size multiplier: larger apartments tend to have lower price per m².
 * Small studios (<30m²) command premium per m², large apartments (>100m²) have discount.
 */
function getSizeMultiplier(areaM2: number): number {
  if (areaM2 <= 25) return 1.08;  // tiny studio premium
  if (areaM2 <= 40) return 1.03;
  if (areaM2 <= 60) return 1.0;   // standard 2-room flat
  if (areaM2 <= 80) return 0.98;
  if (areaM2 <= 100) return 0.96;
  if (areaM2 <= 130) return 0.94;
  return 0.92; // luxury large — lower per m²
}

export interface DistrictContext {
  avgSaleM2: number;
  noiseAvgDb?: number;
  airQualityAqi?: number;
  crimePerCapita?: number;
  cityAvgCrimePerCapita?: number;
  transitScore?: number; // 0-100
}

/**
 * Compute the fair price for a listing using the hedonic model.
 */
export function computeFairPrice(
  listing: ListingDetails,
  districtCtx: DistrictContext
): HedonicResult {
  const basePrice = districtCtx.avgSaleM2;

  // Compute individual factors
  const factors: HedonicFactors = {
    condition: CONDITION_MULTIPLIERS[listing.condition],
    floor: getFloorMultiplier(listing.floor, listing.totalFloors, listing.hasElevator),
    noise: districtCtx.noiseAvgDb ? getNoiseMultiplier(districtCtx.noiseAvgDb) : 1.0,
    airQuality: districtCtx.airQualityAqi ? getAirQualityMultiplier(districtCtx.airQualityAqi) : 1.0,
    crime: (districtCtx.crimePerCapita && districtCtx.cityAvgCrimePerCapita)
      ? getCrimeMultiplier(districtCtx.crimePerCapita, districtCtx.cityAvgCrimePerCapita)
      : 1.0,
    transit: districtCtx.transitScore ? getTransitMultiplier(districtCtx.transitScore) : 1.0,
    buildingType: BUILDING_TYPE_MULTIPLIERS[listing.buildingType],
    energyClass: listing.energyClass ? (ENERGY_CLASS_MULTIPLIERS[listing.energyClass] || 1.0) : 1.0,
    size: getSizeMultiplier(listing.areaM2),
  };

  // Compute fair price per m²
  const totalMultiplier = Object.values(factors).reduce((acc, f) => acc * f, 1);
  const fairPricePerM2 = Math.round(basePrice * totalMultiplier);
  const fairPriceTotal = Math.round(fairPricePerM2 * listing.areaM2);

  // Confidence: how many data points we actually have (more data = higher confidence)
  let dataPoints = 2; // always have condition + building type + district avg
  if (listing.floor > 0) dataPoints++;
  if (districtCtx.noiseAvgDb) dataPoints++;
  if (districtCtx.airQualityAqi) dataPoints++;
  if (districtCtx.crimePerCapita) dataPoints++;
  if (districtCtx.transitScore) dataPoints++;
  if (listing.energyClass) dataPoints++;
  if (listing.hasElevator !== undefined) dataPoints++;

  const maxDataPoints = 9;
  const confidence = Math.min(95, Math.round((dataPoints / maxDataPoints) * 85 + 10));

  return {
    fairPricePerM2,
    fairPriceTotal,
    factors,
    confidence,
    basePrice,
  };
}
