import { DISTRICTS, type District } from "@/app/data/districts";

export interface WizardAnswers {
  budget: "low" | "balanced" | "premium";
  household: "single" | "couple" | "family" | "retiree";
  priorities: string[];
  workZone: "center" | "west" | "north" | "east" | "south" | "remote";
}

export interface Recommendation {
  districtId: number;
  name: string;
  score: number;
  reasons: string[];
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

const ZONE_DISTRICTS: Record<string, number[]> = {
  center: [1, 2, 3],
  west: [5, 6, 13, 17],
  north: [7, 8, 9, 18, 19],
  east: [10, 14, 15, 21, 22],
  south: [4, 11, 12, 16, 20],
  remote: [],
};

export function computeRecommendations(answers: WizardAnswers): Recommendation[] {
  return DISTRICTS.map((d) => {
    let score = 0;
    const reasons: string[] = [];

    // Base metrics
    const rent = 100 - normalize(d.housing.avgRentM2, 200, 500);
    const safety = 100 - normalize((d.crime.total2023 / d.population) * 1000, 15, 80);
    const green = normalize((d.greenSpace.totalHa / d.area) * 100, 5, 40);
    const schools = normalize(d.schools.primary + d.schools.secondary + d.schools.kindergarten, 5, 40);
    const transit = normalize(Math.max(0, 10 - d.transitAlerts.length) * 10, 0, 100);
    const quiet = 100 - normalize(d.noiseMaps.dayAvgDb, 45, 70);
    const culture = normalize(d.culture.venues, 3, 20);

    // Budget preference
    if (answers.budget === "low") {
      score += rent * 3;
      if (rent > 60) reasons.push("Very affordable rent");
    } else if (answers.budget === "premium") {
      score += (100 - rent) * 1.5 + safety * 1.5;
      if (safety > 70) reasons.push("Premium, safe neighborhood");
    } else {
      score += rent * 1.5 + safety;
    }

    // Household
    if (answers.household === "family") {
      score += schools * 2 + green * 1.5 + quiet * 1.5;
      if (schools > 60) reasons.push("Excellent schools");
      if (green > 50) reasons.push("Great parks for kids");
    } else if (answers.household === "retiree") {
      score += quiet * 2 + green * 2 + safety * 1.5;
      if (quiet > 60) reasons.push("Peaceful neighborhood");
    } else if (answers.household === "single") {
      score += culture * 2 + transit * 1.5;
      if (culture > 60) reasons.push("Vibrant cultural scene");
    } else {
      score += safety + green + transit;
    }

    // Priority multipliers
    for (const p of answers.priorities) {
      switch (p) {
        case "green": score += green * 2; if (green > 60) reasons.push("Abundant green space"); break;
        case "nightlife": score += culture * 2; if (culture > 60) reasons.push("Active nightlife & culture"); break;
        case "quiet": score += quiet * 2; if (quiet > 60) reasons.push("Low noise levels"); break;
        case "schools": score += schools * 2; if (schools > 60) reasons.push("Strong school network"); break;
        case "transit": score += transit * 2; if (transit > 70) reasons.push("Excellent transit access"); break;
        case "safety": score += safety * 2; if (safety > 60) reasons.push("Low crime area"); break;
      }
    }

    // Work zone proximity
    if (answers.workZone !== "remote") {
      const zoneDistricts = ZONE_DISTRICTS[answers.workZone];
      if (zoneDistricts.includes(d.id)) {
        score += 80;
        reasons.push("Close to your workplace");
      } else {
        // Check adjacency (within ±2)
        const isNearby = zoneDistricts.some(zd => Math.abs(zd - d.id) <= 2);
        if (isNearby) score += 40;
      }
    }

    // Deduplicate reasons
    const uniqueReasons = [...new Set(reasons)].slice(0, 3);

    return {
      districtId: d.id,
      name: d.name,
      score: Math.round(score / 10),
      reasons: uniqueReasons,
    };
  }).sort((a, b) => b.score - a.score);
}
