import { type District } from "@/app/data/districts";
import { type BulkData, fmtCZK } from "./useLiveData";

export function generateSummary(district: District, bulk: BulkData | null): string {
  const parts: string[] = [];

  // Air quality
  if (bulk?.air?.data) {
    const air = bulk.air.data as { aqi: number; status: string };
    parts.push(`Air quality is ${air.status} (AQI ${air.aqi})`);
  } else {
    parts.push(`Air quality is ${district.airQuality.status} (AQI ${district.airQuality.aqi})`);
  }

  // Contracts
  if (bulk?.contracts?.data) {
    const contracts = bulk.contracts.data as { value: number }[];
    if (contracts.length > 0) {
      const total = contracts.reduce((s, c) => s + c.value, 0);
      parts.push(`${contracts.length} recent contracts worth ${fmtCZK(total)}`);
    }
  } else if (district.contracts.length > 0) {
    const total = district.contracts.reduce((s, c) => s + c.value, 0);
    parts.push(`${district.contracts.length} contracts worth ${fmtCZK(total)}`);
  }

  // Transit
  if (bulk?.transit?.data) {
    const transit = bulk.transit.data as unknown[];
    if (transit.length > 0) {
      parts.push(`${transit.length} active transit disruption${transit.length > 1 ? "s" : ""}`);
    } else {
      parts.push("No transit disruptions");
    }
  } else if (district.transitAlerts.length > 0) {
    parts.push(`${district.transitAlerts.length} transit alert${district.transitAlerts.length > 1 ? "s" : ""}`);
  }

  // Holidays
  if (bulk?.holidays?.data) {
    const holidays = bulk.holidays.data as { nextHoliday: { name: string; daysUntil: number } };
    if (holidays.nextHoliday) {
      parts.push(
        holidays.nextHoliday.daysUntil === 0
          ? `Today is ${holidays.nextHoliday.name}!`
          : `Next holiday in ${holidays.nextHoliday.daysUntil} days (${holidays.nextHoliday.name})`
      );
    }
  }

  // Crime trend
  const crimeChange = district.crime.change;
  if (crimeChange !== 0) {
    parts.push(
      `Crime ${crimeChange < 0 ? "down" : "up"} ${Math.abs(crimeChange).toFixed(1)}% year-over-year`
    );
  }

  // Budget
  const surplus = district.budget.surplus;
  if (surplus !== 0) {
    parts.push(
      surplus > 0
        ? `Budget surplus of ${fmtCZK(surplus * 1_000_000)}`
        : `Budget deficit of ${fmtCZK(Math.abs(surplus) * 1_000_000)}`
    );
  }

  // Employment
  parts.push(`Unemployment at ${district.employment.unemploymentRate}%`);

  return parts.slice(0, 5).join(". ") + ".";
}
