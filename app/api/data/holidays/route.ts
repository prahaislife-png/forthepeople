import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface HolidaysData {
  nextHoliday: { name: string; date: string; daysUntil: number };
  upcoming: Array<{ name: string; date: string }>;
  totalPerYear: number;
}

const SOURCE = "https://www.mpsv.cz";
const CACHE_TTL = 12 * 60 * 60 * 1000;

const CZ_HOLIDAYS_2026 = [
  { name: "New Year's Day", date: "2026-01-01" },
  { name: "Good Friday", date: "2026-04-03" },
  { name: "Easter Monday", date: "2026-04-06" },
  { name: "Labour Day", date: "2026-05-01" },
  { name: "Victory Day", date: "2026-05-08" },
  { name: "Saints Cyril & Methodius", date: "2026-07-05" },
  { name: "Jan Hus Day", date: "2026-07-06" },
  { name: "Statehood Day", date: "2026-09-28" },
  { name: "Independence Day", date: "2026-10-28" },
  { name: "Freedom & Democracy Day", date: "2026-11-17" },
  { name: "Christmas Eve", date: "2026-12-24" },
  { name: "Christmas Day", date: "2026-12-25" },
  { name: "St. Stephen's Day", date: "2026-12-26" },
];

function computeHolidays(): HolidaysData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = CZ_HOLIDAYS_2026.filter(h => new Date(h.date) >= today);
  const next = upcoming[0] || CZ_HOLIDAYS_2026[0];
  const nextDate = new Date(next.date);
  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    nextHoliday: { name: next.name, date: next.date, daysUntil: Math.max(0, daysUntil) },
    upcoming: upcoming.slice(0, 4),
    totalPerYear: 13,
  };
}

export async function GET() {
  const cacheKey = "holidays";
  const cached = getCached<HolidaysData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<HolidaysData>);
  }

  const data = computeHolidays();
  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<HolidaysData>);
}
