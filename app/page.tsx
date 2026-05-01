"use client";

import { useState, useEffect } from "react";
import { DISTRICTS, getDistrict } from "./data/districts";

type Lang = "en" | "cs";

// ─── Live Data Hook ──────────────────────────────────────────────────────────

interface LiveState<T> {
  status: "live" | "loading" | "error";
  data: T | null;
  fetchedAt: string | null;
}

function useLiveData<T>(url: string | null): LiveState<T> {
  const [state, setState] = useState<LiveState<T>>({ status: "loading", data: null, fetchedAt: null });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setState({ status: json.status === "live" ? "live" : "error", data: json.data, fetchedAt: json.fetchedAt });
      })
      .catch(() => { if (!cancelled) setState({ status: "error", data: null, fetchedAt: null }); });
    return () => { cancelled = true; };
  }, [url]);

  return state;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtCZK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M Kč`;
  if (n >= 1_000) return `${Math.round(n / 1000)} tis. Kč`;
  return `${n} Kč`;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Page() {
  const [districtId, setDistrictId] = useState(7);
  const [lang, setLang] = useState<Lang>("en");
  const d = getDistrict(districtId);

  const liveWeather = useLiveData<{ temperature: number; windspeed: number; description: string }>("/api/data/weather");
  const liveAir = useLiveData<{ pm25: number; pm10: number; no2: number; o3: number; aqi: number; status: string }>("/api/data/air");
  const liveTransit = useLiveData<{ title: string; link: string; pubDate: string; description: string }[]>("/api/data/transit");
  const liveContracts = useLiveData<{ id: string; supplier: string; subject: string; value: number; date: string }[]>(
    `/api/data/contracts?district=${districtId}`
  );
  const liveHealth = useLiveData<{ pharmacies: number; gps: number; specialists: number; hospitals: number; total: number; facilities: { name: string; type: string; address: string }[] }>(
    `/api/data/health?district=${districtId}`
  );
  const liveWaste = useLiveData<{ stations: number; containers: number; types: Record<string, number>; monitoredContainers: number }>(
    `/api/data/waste?district=${districtId}`
  );
  const liveParks = useLiveData<{ total: number; parks: { name: string; description: string }[] }>(
    `/api/data/parks?district=${districtId}`
  );
  const liveSports = useLiveData<{ playgrounds: number; facilities: { name: string; address: string }[] }>(
    `/api/data/sports?district=${districtId}`
  );
  const liveLibraries = useLiveData<{ total: number; libraries: { name: string; address: string; web?: string }[] }>(
    `/api/data/libraries?district=${districtId}`
  );
  const liveBusiness = useLiveData<{ ico: string; name: string; legalForm: string; address: string }>(
    `/api/data/business?district=${districtId}`
  );
  const liveCityHall = useLiveData<{ name: string; address: string; phone?: string; email?: string; web?: string }>(
    `/api/data/cityhall?district=${districtId}`
  );

  const allFetchedAts = [liveWeather, liveAir, liveTransit, liveContracts, liveHealth, liveWaste, liveParks, liveSports, liveLibraries, liveBusiness, liveCityHall]
    .map((s) => s.fetchedAt)
    .filter(Boolean) as string[];
  const latestUpdate = allFetchedAts.length > 0 ? allFetchedAts.sort().reverse()[0] : null;

  const t = lang === "en" ? {
    tagline: "Real-time civic data for Prague districts",
    updated: "Updated",
    population: "residents",
    signIn: "Sign in",
    unlockTitle: "Unlock 25+ data categories",
    unlockDesc: "Sign in for free to access budget analysis, crime statistics, election results, housing data, and more.",
    unlockBtn: "Sign in — coming soon",
    sources: "Sources",
    contracts: "Public Contracts",
    health: "Health & Medical",
    transit: "Transit Alerts",
    waste: "Waste & Recycling",
    parks: "Parks & Green",
    sports: "Sports & Playgrounds",
    libraries: "Libraries",
    business: "Business Registry",
    cityHall: "City Hall",
    weather: "Weather",
    airQuality: "Air Quality",
    locked: "Budget · Crime · Elections · Housing · Employment · Schools · Tenders · EU Funds · Demographics · Energy · Water · Noise",
  } : {
    tagline: "Data v reálném čase pro pražské městské části",
    updated: "Aktualizováno",
    population: "obyvatel",
    signIn: "Přihlásit se",
    unlockTitle: "Odemkněte 25+ kategorií dat",
    unlockDesc: "Přihlaste se zdarma pro přístup k rozpočtům, kriminalitě, volbám, bydlení a dalším datům.",
    unlockBtn: "Přihlášení — již brzy",
    sources: "Zdroje",
    contracts: "Veřejné smlouvy",
    health: "Zdravotnictví",
    transit: "Dopravní informace",
    waste: "Odpady a recyklace",
    parks: "Parky a zeleň",
    sports: "Sport a hřiště",
    libraries: "Knihovny",
    business: "Obchodní rejstřík",
    cityHall: "Radnice",
    weather: "Počasí",
    airQuality: "Kvalita ovzduší",
    locked: "Rozpočet · Kriminalita · Volby · Bydlení · Zaměstnanost · Školy · Zakázky · EU fondy · Demografie · Energie · Voda · Hluk",
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-gray-900">ForThePeople</span>
              <span className="text-base font-bold text-red-700">.cz</span>
            </a>
            <a href="/sources" className="text-xs text-gray-400 hover:text-gray-700 transition-colors hidden sm:block">
              {t.sources}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={districtId}
              onChange={(e) => setDistrictId(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              {DISTRICTS.map((dist) => (
                <option key={dist.id} value={dist.id}>Praha {dist.id}</option>
              ))}
            </select>
            <button
              onClick={() => setLang(lang === "en" ? "cs" : "en")}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded"
            >
              {lang === "en" ? "CS" : "EN"}
            </button>
            <button className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
              {t.signIn}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {lang === "cs" ? d.nameCz : d.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Intl.NumberFormat("cs-CZ").format(d.population)} {t.population} · {d.area} km²
              </p>
            </div>
            <div className="flex items-center gap-4">
              {latestUpdate && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">
                    {t.updated} {timeAgo(latestUpdate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-6 text-xs">
          {liveWeather.data && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{t.weather}</span>
              <span className="font-mono font-medium text-gray-900">{liveWeather.data.temperature}°C</span>
              <span className="text-gray-500">{liveWeather.data.description}</span>
            </div>
          )}
          {liveAir.data && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{t.airQuality}</span>
              <span className={`font-mono font-medium ${liveAir.data.aqi < 50 ? "text-green-700" : liveAir.data.aqi < 100 ? "text-amber-700" : "text-red-700"}`}>
                AQI {liveAir.data.aqi}
              </span>
              <span className="text-gray-500">PM2.5 {liveAir.data.pm25} µg/m³</span>
            </div>
          )}
          {liveTransit.data && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{t.transit}</span>
              <span className="font-mono font-medium text-blue-700">{liveTransit.data.length} alerts</span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Contracts Card */}
          <Card title={t.contracts} live={liveContracts.status === "live"} source="smlouvy.gov.cz">
            {liveContracts.data && liveContracts.data.length > 0 ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold font-mono text-gray-900">{liveContracts.data.length}</div>
                <div className="text-xs text-gray-500 -mt-2">{lang === "en" ? "recent contracts" : "posledních smluv"}</div>
                <div className="space-y-2 mt-3">
                  {liveContracts.data.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex justify-between items-start gap-2 text-xs">
                      <span className="text-gray-700 line-clamp-1 flex-1">{c.subject}</span>
                      <span className="font-mono text-red-700 font-medium shrink-0">{fmtCZK(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Health Card */}
          <Card title={t.health} live={liveHealth.status === "live"} source="api.golemio.cz">
            {liveHealth.data ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold font-mono text-gray-900">{liveHealth.data.total}</div>
                <div className="text-xs text-gray-500 -mt-2">{lang === "en" ? "medical facilities" : "zdravotnických zařízení"}</div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Stat label={lang === "en" ? "Pharmacies" : "Lékárny"} value={liveHealth.data.pharmacies} />
                  <Stat label={lang === "en" ? "Clinics" : "Ordinace"} value={liveHealth.data.total - liveHealth.data.pharmacies} />
                </div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Transit Card */}
          <Card title={t.transit} live={liveTransit.status === "live"} source="pid.cz">
            {liveTransit.data && liveTransit.data.length > 0 ? (
              <div className="space-y-2.5">
                {liveTransit.data.slice(0, 3).map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-700 hover:text-red-700 transition-colors line-clamp-2 leading-relaxed">
                    {item.title}
                  </a>
                ))}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Waste Card */}
          <Card title={t.waste} live={liveWaste.status === "live"} source="api.golemio.cz">
            {liveWaste.data ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <div>
                    <div className="text-2xl font-bold font-mono text-gray-900">{liveWaste.data.stations}</div>
                    <div className="text-xs text-gray-500">{lang === "en" ? "stations" : "stanovišť"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-gray-900">{liveWaste.data.containers}</div>
                    <div className="text-xs text-gray-500">{lang === "en" ? "containers" : "kontejnerů"}</div>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  {Object.entries(liveWaste.data.types).slice(0, 4).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-mono text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Parks Card */}
          <Card title={t.parks} live={liveParks.status === "live"} source="api.golemio.cz">
            {liveParks.data ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold font-mono text-gray-900">{liveParks.data.total}</div>
                <div className="text-xs text-gray-500 -mt-2">{lang === "en" ? "parks & gardens" : "parků a zahrad"}</div>
                {liveParks.data.parks.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {liveParks.data.parks.slice(0, 4).map((p) => (
                      <div key={p.name} className="text-xs text-gray-700">{p.name}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Sports Card */}
          <Card title={t.sports} live={liveSports.status === "live"} source="api.golemio.cz">
            {liveSports.data ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold font-mono text-gray-900">{liveSports.data.playgrounds}</div>
                <div className="text-xs text-gray-500 -mt-2">{lang === "en" ? "playgrounds & facilities" : "hřišť a sportovišť"}</div>
                {liveSports.data.facilities.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {liveSports.data.facilities.slice(0, 3).map((f) => (
                      <div key={f.name} className="text-xs text-gray-700 line-clamp-1">{f.name}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Libraries Card */}
          <Card title={t.libraries} live={liveLibraries.status === "live"} source="api.golemio.cz">
            {liveLibraries.data ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold font-mono text-gray-900">{liveLibraries.data.total}</div>
                <div className="text-xs text-gray-500 -mt-2">{lang === "en" ? "libraries" : "knihoven"}</div>
                {liveLibraries.data.libraries.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {liveLibraries.data.libraries.slice(0, 4).map((lib) => (
                      <div key={lib.name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{lib.name}</span>
                        {lib.web && <a href={lib.web} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline shrink-0">→</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Business Card */}
          <Card title={t.business} live={liveBusiness.status === "live"} source="ares.gov.cz">
            {liveBusiness.data ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">{liveBusiness.data.name}</div>
                <div className="text-xs text-gray-500">IČO: {liveBusiness.data.ico}</div>
                <div className="text-xs text-gray-600 mt-1">{liveBusiness.data.address}</div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* City Hall Card */}
          <Card title={t.cityHall} live={liveCityHall.status === "live"} source="api.golemio.cz">
            {liveCityHall.data ? (
              <div className="space-y-2 text-xs">
                {liveCityHall.data.address && (
                  <div className="text-gray-700">{liveCityHall.data.address}</div>
                )}
                {liveCityHall.data.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Tel</span>
                    <span className="font-mono text-gray-900">{liveCityHall.data.phone}</span>
                  </div>
                )}
                {liveCityHall.data.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Email</span>
                    <span className="text-gray-700">{liveCityHall.data.email}</span>
                  </div>
                )}
                {liveCityHall.data.web && (
                  <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline font-medium block mt-1">
                    {liveCityHall.data.web}
                  </a>
                )}
              </div>
            ) : <Skeleton />}
          </Card>
        </div>

        {/* Premium Wall */}
        <div className="relative mt-16 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-[6px] opacity-40 pointer-events-none select-none">
            {[
              lang === "en" ? "District Budget" : "Rozpočet",
              lang === "en" ? "Crime Statistics" : "Kriminalita",
              lang === "en" ? "Elections" : "Volby",
              lang === "en" ? "Housing & Rent" : "Bydlení",
              lang === "en" ? "Employment" : "Zaměstnanost",
              lang === "en" ? "Schools" : "Školy",
            ].map((title) => (
              <div key={title} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4 border border-gray-100">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t.unlockTitle}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t.unlockDesc}</p>
              <button className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors mb-3">
                {t.unlockBtn}
              </button>
              <p className="text-[10px] text-gray-400">{t.locked}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900">ForThePeople</span>
            <span className="text-sm font-bold text-red-700">.cz</span>
          </div>
          <div className="text-xs text-gray-400 text-center">
            {lang === "en" ? "Open civic data for Prague's 22 districts" : "Otevřená občanská data pro 22 pražských městských částí"}
          </div>
          <a href="/sources" className="text-xs text-red-700 hover:underline font-medium">
            {t.sources} →
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ title, live, source, children }: { title: string; live: boolean; source: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-[10px] text-gray-400 font-mono">{source}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
      <div className="text-lg font-bold font-mono text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}
