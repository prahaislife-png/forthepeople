"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/app/hooks/useSubscription";
import { trackEvent } from "@/app/lib/analytics";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { DISTRICTS } from "@/app/data/districts";
import {
  Shield, Home, GraduationCap, Train, Wind, TreePine,
  Activity, Zap, Users, TrendingUp, MapPin, Star,
  ArrowLeft, Share2, Download,
} from "lucide-react";
import Link from "next/link";

interface BulkData {
  [key: string]: { status: string; data: unknown };
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-extrabold text-white -mt-16">{score}</span>
      <span className="text-xs text-slate-400 mt-10">{label}</span>
    </div>
  );
}

function StatBar({ label, value, max, avg }: { label: string; value: number; max: number; avg: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const avgPct = Math.min(100, (avg / max) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-semibold">{value.toLocaleString()}</span>
      </div>
      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: `${avgPct}%` }} title={`City avg: ${avg}`} />
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-600/20">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function calculateLivabilityScore(district: typeof DISTRICTS[0], bulk: BulkData): { total: number; breakdown: Record<string, number> } {
  const d = district;
  const safety = Math.max(0, 100 - (d.crime.total2023 / 50));
  const housing = Math.min(100, Math.max(0, 100 - ((d.housing.avgRentM2 - 200) / 3)));
  const education = Math.min(100, (d.schools.primary + d.schools.secondary + d.schools.kindergarten) * 4);
  const transit = bulk.transit?.data ? 80 : 60;
  const environment = Math.max(0, 100 - d.airQuality.aqi * 2);
  const green = Math.min(100, d.greenSpace.totalHa * 2);
  const healthcare = Math.min(100, (d.health.gps + d.health.specialists + d.health.pharmacies) * 3);

  const total = Math.round((safety * 0.2 + housing * 0.2 + education * 0.15 + transit * 0.15 + environment * 0.1 + green * 0.1 + healthcare * 0.1) );
  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: { safety, housing, education, transit, environment, green, healthcare },
  };
}

export default function ReportPage() {
  const params = useParams();
  const districtId = parseInt(params.districtId as string);
  const { user } = useAuth();
  const { canAccessReport, loading: subLoading } = useSubscription();
  const [bulk, setBulk] = useState<BulkData | null>(null);
  const [loading, setLoading] = useState(true);

  const district = DISTRICTS.find((d) => d.id === districtId);

  useEffect(() => {
    if (!district) return;
    trackEvent("report_viewed", { districtId });
    fetch(`/api/data/bulk?district=${districtId}`)
      .then((r) => r.json())
      .then((data) => { setBulk(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [districtId]);

  if (!district) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white text-lg">District not found.</p>
      </div>
    );
  }

  const hasAccess = canAccessReport(districtId);
  const score = bulk ? calculateLivabilityScore(district, bulk) : { total: 0, breakdown: {} };

  const cityAvg = {
    rent: 380,
    sale: 120000,
    crime: 2800,
    aqi: 35,
    noise: 58,
    schools: 22,
    greenHa: 35,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to districts</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <Share2 className="h-4 w-4" /> Share
            </button>
            {hasAccess && (
              <button className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                <Download className="h-4 w-4" /> Export PDF
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Report title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-slate-400">District Report</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{district.name}</h1>
            <p className="text-slate-400 mt-1">{district.nameCz} • Generated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-6">
            <ScoreRing score={score.total} label="Livability" />
          </div>
        </div>

        {/* Content - with paywall overlay if needed */}
        <div className="relative">
          {!hasAccess && !subLoading && <PaywallOverlay districtId={districtId} districtName={district.name} />}

          <div className={!hasAccess ? "filter blur-sm pointer-events-none select-none" : ""}>
            {/* Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Population", value: district.population.toLocaleString() },
                { label: "Area", value: `${district.area} km²` },
                { label: "Mayor", value: district.mayor },
                { label: "Party", value: district.mayorParty },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400">{s.label}</div>
                  <div className="text-lg font-bold text-white mt-1">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Main sections grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Housing */}
              <SectionCard icon={Home} title="Housing Market">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Avg Rent/m²</div>
                      <div className="text-2xl font-bold text-white">{district.housing.avgRentM2} <span className="text-sm text-slate-400">Kč</span></div>
                      <div className="text-xs text-slate-500">City avg: {cityAvg.rent} Kč</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Avg Sale/m²</div>
                      <div className="text-2xl font-bold text-white">{(district.housing.avgSaleM2 / 1000).toFixed(0)}k <span className="text-sm text-slate-400">Kč</span></div>
                      <div className="text-xs text-slate-500">City avg: {cityAvg.sale / 1000}k Kč</div>
                    </div>
                  </div>
                  <StatBar label="Vacancy Rate" value={district.housing.vacancyRate} max={10} avg={3.2} />
                  <StatBar label="New Construction" value={district.housing.newConstructionUnits} max={500} avg={180} />
                  <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-2">5-Year Rent Trend (Kč/m²)</div>
                    <div className="flex items-end gap-1 h-16">
                      {district.housing.rentTrend.map((point) => (
                        <div key={point.year} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className="w-full bg-blue-500/60 rounded-t"
                            style={{ height: `${((point.avgRent - 200) / 200) * 100}%` }}
                          />
                          <span className="text-[9px] text-slate-500">{point.year.toString().slice(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Safety */}
              <SectionCard icon={Shield} title="Safety & Crime">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Total Incidents (2023)</div>
                      <div className="text-2xl font-bold text-white">{district.crime.total2023.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">City avg: {cityAvg.crime.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Year Change</div>
                      <div className={`text-2xl font-bold ${district.crime.change < 0 ? "text-green-400" : "text-red-400"}`}>
                        {district.crime.change > 0 ? "+" : ""}{district.crime.change}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {district.crime.categories.slice(0, 5).map((cat) => (
                      <div key={cat.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{cat.label}</span>
                        <span className="text-white font-medium">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Education */}
              <SectionCard icon={GraduationCap} title="Education">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Primary", count: district.schools.primary },
                      { label: "Secondary", count: district.schools.secondary },
                      { label: "Kindergarten", count: district.schools.kindergarten },
                      { label: "Universities", count: district.schools.universities },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-700/50 rounded-lg p-2">
                        <div className="text-xl font-bold text-white">{s.count}</div>
                        <div className="text-[10px] text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <StatBar label="Total Schools" value={district.schools.primary + district.schools.secondary + district.schools.kindergarten} max={60} avg={cityAvg.schools} />
                </div>
              </SectionCard>

              {/* Transit */}
              <SectionCard icon={Train} title="Transit & Mobility">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Metro", count: district.transitAlerts.filter(a => a.type === "metro").length > 0 ? "Yes" : "No" },
                      { label: "Tram Lines", count: "Multiple" },
                      { label: "Bus Lines", count: "Multiple" },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-700/50 rounded-lg p-2">
                        <div className="text-sm font-bold text-white">{s.count}</div>
                        <div className="text-[10px] text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {district.transitAlerts.length > 0 && (
                    <div className="text-xs text-amber-400">
                      {district.transitAlerts.length} active disruption{district.transitAlerts.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Environment */}
              <SectionCard icon={Wind} title="Environment & Air Quality">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "AQI", value: district.airQuality.aqi },
                      { label: "PM2.5", value: district.airQuality.pm25 },
                      { label: "PM10", value: district.airQuality.pm10 },
                      { label: "NO₂", value: district.airQuality.no2 },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-700/50 rounded-lg p-2">
                        <div className="text-lg font-bold text-white">{s.value}</div>
                        <div className="text-[10px] text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      district.airQuality.status === "good" ? "bg-green-500" :
                      district.airQuality.status === "fair" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <span className="text-sm text-slate-300 capitalize">{district.airQuality.status}</span>
                    <span className="text-xs text-slate-500 ml-auto">City avg AQI: {cityAvg.aqi}</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Noise Level</div>
                    <StatBar label="Day (dB)" value={district.noiseMaps.dayAvgDb} max={80} avg={cityAvg.noise} />
                  </div>
                </div>
              </SectionCard>

              {/* Green Spaces */}
              <SectionCard icon={TreePine} title="Green Spaces & Parks">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Total Green Area</div>
                      <div className="text-2xl font-bold text-white">{district.greenSpace.totalHa} <span className="text-sm text-slate-400">ha</span></div>
                      <div className="text-xs text-slate-500">City avg: {cityAvg.greenHa} ha</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Trees Planted (2023)</div>
                      <div className="text-2xl font-bold text-white">{district.greenSpace.treesPlanted2023}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {district.greenSpace.parks.slice(0, 4).map((p) => (
                      <div key={p.name} className="flex justify-between text-sm">
                        <span className="text-slate-300">{p.name}</span>
                        <span className="text-white">{p.ha} ha</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Healthcare */}
              <SectionCard icon={Activity} title="Healthcare">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: "GPs", count: district.health.gps },
                    { label: "Specialists", count: district.health.specialists },
                    { label: "Pharmacies", count: district.health.pharmacies },
                    { label: "Hospitals", count: district.health.hospitals },
                    { label: "Social", count: district.health.socialCenters },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-700/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-white">{s.count}</div>
                      <div className="text-[10px] text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Energy */}
              <SectionCard icon={Zap} title="Energy & Utilities">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Heat Price</div>
                      <div className="text-lg font-bold text-white">{district.energy.heatPriceGJ} <span className="text-sm text-slate-400">Kč/GJ</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Avg Annual Bill (70m²)</div>
                      <div className="text-lg font-bold text-white">{(district.energy.avgAnnualHeatBill / 1000).toFixed(1)}k <span className="text-sm text-slate-400">Kč</span></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Supplier</span>
                    <span className="text-white">{district.energy.heatingSupplier}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Renewable Share</span>
                    <span className="text-white">{district.energy.renewableShare}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Solar Panels (public)</span>
                    <span className="text-white">{district.energy.solarPanelsInstalled}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Employment */}
              <SectionCard icon={TrendingUp} title="Employment & Economy">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-slate-400">Unemployment</div>
                      <div className="text-xl font-bold text-white">{district.employment.unemploymentRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Avg Salary</div>
                      <div className="text-xl font-bold text-white">{(district.employment.avgSalaryCZK / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Companies</div>
                      <div className="text-xl font-bold text-white">{district.business.registeredCompanies.toLocaleString()}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Top Employers</div>
                    <div className="flex flex-wrap gap-1">
                      {district.employment.topEmployers.slice(0, 5).map((e) => (
                        <span key={e} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Lifestyle */}
              <SectionCard icon={Users} title="Lifestyle & Culture">
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-700/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-white">{district.sports.pools}</div>
                      <div className="text-[10px] text-slate-400">Pools</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-white">{district.sports.playgrounds}</div>
                      <div className="text-[10px] text-slate-400">Playgrounds</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-white">{district.culture.venues}</div>
                      <div className="text-[10px] text-slate-400">Venues</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-white">{district.culture.libraries}</div>
                      <div className="text-[10px] text-slate-400">Libraries</div>
                    </div>
                  </div>
                  {district.culture.events.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Upcoming Events</div>
                      {district.culture.events.slice(0, 3).map((ev) => (
                        <div key={ev.title} className="flex justify-between text-sm py-1">
                          <span className="text-slate-300">{ev.title}</span>
                          <span className="text-slate-500 text-xs">{ev.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Verdict */}
            <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-6 w-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Verdict & Recommendation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-300 leading-relaxed">
                    {district.name} scores <strong className="text-white">{score.total}/100</strong> on our livability index.
                    {score.total >= 70
                      ? " This is an excellent district for living with strong infrastructure, good safety record, and quality amenities."
                      : score.total >= 50
                      ? " This is a solid district with good fundamentals. Some areas could be improved but overall a good choice for residents."
                      : " This district has some challenges but may offer value for those who prioritize specific aspects like affordability or location."
                    }
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">+</span>
                      <span className="text-slate-300">
                        {district.housing.avgRentM2 < cityAvg.rent ? "Below-average rent prices" : "Strong housing market"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">+</span>
                      <span className="text-slate-300">
                        {district.greenSpace.totalHa > cityAvg.greenHa ? "Above-average green space" : "Good park accessibility"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-amber-400">~</span>
                      <span className="text-slate-300">
                        {district.crime.total2023 > cityAvg.crime ? "Higher-than-average crime rate" : "Good safety record"}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-3">Score Breakdown</div>
                  <div className="space-y-2">
                    {Object.entries(score.breakdown).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-20 capitalize">{key}</span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${Math.max(0, Math.min(100, val as number))}%` }}
                          />
                        </div>
                        <span className="text-xs text-white font-semibold w-8 text-right">{Math.round(val as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
