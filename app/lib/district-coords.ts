export interface DistrictCoord {
  lat: number;
  lng: number;
  name: string;
  slug: string;
}

export const DISTRICT_COORDS: Record<number, DistrictCoord> = {
  1: { lat: 50.0875, lng: 14.4213, name: "Praha 1", slug: "praha-1" },
  2: { lat: 50.0755, lng: 14.4308, name: "Praha 2", slug: "praha-2" },
  3: { lat: 50.0833, lng: 14.4500, name: "Praha 3", slug: "praha-3" },
  4: { lat: 50.0400, lng: 14.4300, name: "Praha 4", slug: "praha-4" },
  5: { lat: 50.0667, lng: 14.3953, name: "Praha 5", slug: "praha-5" },
  6: { lat: 50.1000, lng: 14.3900, name: "Praha 6", slug: "praha-6" },
  7: { lat: 50.1000, lng: 14.4400, name: "Praha 7", slug: "praha-7" },
  8: { lat: 50.1150, lng: 14.4700, name: "Praha 8", slug: "praha-8" },
  9: { lat: 50.1100, lng: 14.5000, name: "Praha 9", slug: "praha-9" },
  10: { lat: 50.0700, lng: 14.4900, name: "Praha 10", slug: "praha-10" },
  11: { lat: 50.0300, lng: 14.5100, name: "Praha 11", slug: "praha-11" },
  12: { lat: 50.0100, lng: 14.4200, name: "Praha 12", slug: "praha-12" },
  13: { lat: 50.0500, lng: 14.3300, name: "Praha 13", slug: "praha-13" },
  14: { lat: 50.0200, lng: 14.4500, name: "Praha 14", slug: "praha-14" },
  15: { lat: 50.0500, lng: 14.3600, name: "Praha 15", slug: "praha-15" },
  16: { lat: 50.0400, lng: 14.3500, name: "Praha 16", slug: "praha-16" },
  17: { lat: 50.1350, lng: 14.3700, name: "Praha 17", slug: "praha-17" },
  18: { lat: 50.1300, lng: 14.5200, name: "Praha 18", slug: "praha-18" },
  19: { lat: 50.1300, lng: 14.5500, name: "Praha 19", slug: "praha-19" },
  20: { lat: 50.0700, lng: 14.5300, name: "Praha 20", slug: "praha-20" },
  21: { lat: 50.1500, lng: 14.5100, name: "Praha 21", slug: "praha-21" },
  22: { lat: 50.0800, lng: 14.5700, name: "Praha 22", slug: "praha-22" },
};
