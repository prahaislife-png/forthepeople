import { type District } from "@/app/data/districts";

interface ScoreCategory {
  label: string;
  score: number;
  weight: number;
}

export interface LivabilityScore {
  overall: number;
  categories: ScoreCategory[];
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function computeLivabilityScore(district: District): LivabilityScore {
  const rentScore = 100 - normalize(district.housing.avgRentM2, 200, 500);
  const safetyScore = 100 - normalize((district.crime.total2023 / district.population) * 1000, 15, 80);
  const greenScore = normalize((district.greenSpace.totalHa / district.area) * 100, 5, 40);
  const educationScore = normalize(
    district.schools.primary + district.schools.secondary + district.schools.kindergarten,
    5, 40
  );
  const airScore = 100 - normalize(district.airQuality.aqi, 20, 100);
  const employmentScore = 100 - normalize(district.employment.unemploymentRate, 1, 6);
  const transitScore = normalize(Math.max(0, 10 - district.transitAlerts.length) * 10, 0, 100);

  const categories: ScoreCategory[] = [
    { label: "Safety", score: Math.round(safetyScore), weight: 0.2 },
    { label: "Affordability", score: Math.round(rentScore), weight: 0.2 },
    { label: "Air Quality", score: Math.round(airScore), weight: 0.15 },
    { label: "Employment", score: Math.round(employmentScore), weight: 0.15 },
    { label: "Green Space", score: Math.round(greenScore), weight: 0.1 },
    { label: "Education", score: Math.round(educationScore), weight: 0.1 },
    { label: "Transit", score: Math.round(transitScore), weight: 0.1 },
  ];

  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  return { overall, categories };
}
