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
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M Kc`;
  if (n >= 1_000) return `${Math.round(n / 1000)} tis. Kc`;
  return `${n} Kc`;
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
    tagline: "Data v realnem case pro prazske mestske casti",
    updated: "Aktualizovano",
    population: "obyvatel",
    signIn: "Prihlasit se",
    unlockTitle: "Odemknete 25+ kategorii dat",
    unlockDesc: "Prihlaste se zdarma pro pristup k rozpoctum, kriminalite, volbam, bydleni a dalsim datum.",
    unlockBtn: "Prihlaseni — jiz brzy",
    sources: "Zdroje",
    contracts: "Verejne smlouvy",
    health: "Zdravotnictvi",
    transit: "Dopravni informace",
    waste: "Odpady a recyklace",
    parks: "Parky a zelen",
    sports: "Sport a hriste",
    libraries: "Knihovny",
    business: "Obchodni rejstrik",
    cityHall: "Radnice",
    weather: "Pocasi",
    airQuality: "Kvalita ovzdusi",
    locked: "Rozpocet · Kriminalita · Volby · Bydleni · Zamestnanost · Skoly · Zakazky · EU fondy · Demografie · Energie · Voda · Hluk",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">FP</span>
              </div>
              <span className="text-base font-bold tracking-tight text-gray-900 hidden sm:inline">ForThePeople</span>
              <span className="text-base font-bold text-indigo-600 hidden sm:inline">.cz</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "cs" : "en")}
              className="text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
            >
              {lang === "en" ? "CS" : "EN"}
            </button>
            <a href="/sources" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors hidden sm:block font-medium">
              {t.sources}
            </a>
            <button className="text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300">
              {t.signIn}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient + Abstract Blobs */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        {/* Abstract Blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
        {/* Skyline SVG */}
        <div className="absolute bottom-0 left-0 right-0 opacity-10">
          <svg viewBox="0 0 1200 120" className="w-full" preserveAspectRatio="none">
            <path d="M0,120 L0,80 L40,80 L40,60 L60,60 L60,80 L100,80 L100,40 L110,40 L110,30 L115,20 L120,30 L120,40 L130,40 L130,80 L180,80 L180,50 L200,50 L200,80 L250,80 L250,65 L260,65 L260,45 L270,45 L270,65 L280,65 L280,80 L350,80 L350,55 L360,55 L360,35 L365,25 L370,35 L370,55 L380,55 L380,80 L420,80 L420,70 L440,70 L440,50 L460,50 L460,70 L480,70 L480,80 L550,80 L550,60 L570,60 L570,40 L575,30 L580,40 L580,60 L600,60 L600,80 L680,80 L680,45 L700,45 L700,80 L760,80 L760,55 L770,55 L770,35 L780,35 L780,55 L790,55 L790,80 L850,80 L850,65 L870,65 L870,45 L875,35 L880,45 L880,65 L900,65 L900,80 L970,80 L970,50 L990,50 L990,80 L1050,80 L1050,60 L1060,60 L1060,40 L1070,40 L1070,60 L1080,60 L1080,80 L1150,80 L1150,70 L1170,70 L1170,80 L1200,80 L1200,120 Z" fill="white" />
          </svg>
        </div>
        {/* Bridge arch shapes */}
        <div className="absolute bottom-0 left-1/4 right-1/4 opacity-5">
          <svg viewBox="0 0 400 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 Q50,10 100,60 Q150,10 200,60 Q250,10 300,60 Q350,10 400,60" fill="none" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              {lang === "cs" ? d.nameCz : d.name}
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-white/80 font-medium">
              {new Intl.NumberFormat("cs-CZ").format(d.population)} {t.population} · {d.area} km²
            </p>
            {latestUpdate && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/90 font-medium">
                  {t.updated} {timeAgo(latestUpdate)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* District Selector - Horizontal scrollable pills */}
      <section className="sticky top-16 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DISTRICTS.map((dist) => (
              <button
                key={dist.id}
                onClick={() => setDistrictId(dist.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  dist.id === districtId
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200"
                    : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                Praha {dist.id}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Glassy Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-0 pt-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-indigo-100/50 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Weather */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm11.394-5.834a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">{t.weather}</div>
                {liveWeather.data ? (
                  <div className="text-lg font-bold text-gray-900">{liveWeather.data.temperature}°C</div>
                ) : <div className="text-lg font-bold text-gray-300">--</div>}
              </div>
            </div>
            {/* AQI */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">{t.airQuality}</div>
                {liveAir.data ? (
                  <div className={`text-lg font-bold ${liveAir.data.aqi < 50 ? "text-green-600" : liveAir.data.aqi < 100 ? "text-amber-600" : "text-red-600"}`}>
                    AQI {liveAir.data.aqi}
                  </div>
                ) : <div className="text-lg font-bold text-gray-300">--</div>}
              </div>
            </div>
            {/* PM2.5 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">PM2.5</div>
                {liveAir.data ? (
                  <div className="text-lg font-bold text-gray-900">{liveAir.data.pm25} <span className="text-xs font-normal text-gray-400">ug/m3</span></div>
                ) : <div className="text-lg font-bold text-gray-300">--</div>}
              </div>
            </div>
            {/* Transit */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 4v3m-4-3h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zm-2 4l-2 2m12-2l2 2" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">{t.transit}</div>
                {liveTransit.data ? (
                  <div className="text-lg font-bold text-purple-700">{liveTransit.data.length} alerts</div>
                ) : <div className="text-lg font-bold text-gray-300">--</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Contracts Card */}
          <Card title={t.contracts} source="smlouvy.gov.cz" live={liveContracts.status === "live"} gradient="from-rose-50 to-pink-50" iconBg="from-rose-400 to-pink-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
            {liveContracts.data && liveContracts.data.length > 0 ? (
              <div className="space-y-3">
                <div className="text-3xl font-black text-gray-900">{liveContracts.data.length}</div>
                <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "recent contracts" : "poslednich smluv"}</div>
                <div className="space-y-2.5 mt-3">
                  {liveContracts.data.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex justify-between items-start gap-2 text-xs">
                      <span className="text-gray-600 line-clamp-1 flex-1">{c.subject}</span>
                      <span className="font-mono text-rose-600 font-bold shrink-0">{fmtCZK(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Health Card */}
          <Card title={t.health} source="api.golemio.cz" live={liveHealth.status === "live"} gradient="from-emerald-50 to-teal-50" iconBg="from-emerald-400 to-teal-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}>
            {liveHealth.data ? (
              <div className="space-y-3">
                <div className="text-3xl font-black text-gray-900">{liveHealth.data.total}</div>
                <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "medical facilities" : "zdravotnickych zarizeni"}</div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <MiniStat label={lang === "en" ? "Pharmacies" : "Lekarny"} value={liveHealth.data.pharmacies} color="emerald" />
                  <MiniStat label={lang === "en" ? "Clinics" : "Ordinace"} value={liveHealth.data.total - liveHealth.data.pharmacies} color="teal" />
                </div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Transit Card */}
          <Card title={t.transit} source="pid.cz" live={liveTransit.status === "live"} gradient="from-violet-50 to-purple-50" iconBg="from-violet-400 to-purple-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            {liveTransit.data && liveTransit.data.length > 0 ? (
              <div className="space-y-3">
                {liveTransit.data.slice(0, 3).map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-600 hover:text-purple-700 transition-colors line-clamp-2 leading-relaxed border-l-2 border-purple-200 pl-3">
                    {item.title}
                  </a>
                ))}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Waste Card */}
          <Card title={t.waste} source="api.golemio.cz" live={liveWaste.status === "live"} gradient="from-lime-50 to-green-50" iconBg="from-lime-400 to-green-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}>
            {liveWaste.data ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <div>
                    <div className="text-3xl font-black text-gray-900">{liveWaste.data.stations}</div>
                    <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "stations" : "stanovist"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{liveWaste.data.containers}</div>
                    <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "containers" : "kontejneru"}</div>
                  </div>
                </div>
                {/* Mini bin illustration */}
                <div className="flex gap-1 mt-2">
                  {["bg-yellow-400", "bg-blue-400", "bg-green-500", "bg-gray-400"].map((c, i) => (
                    <div key={i} className={`w-4 h-6 ${c} rounded-t-sm rounded-b-md opacity-60`} />
                  ))}
                </div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Parks Card */}
          <Card title={t.parks} source="api.golemio.cz" live={liveParks.status === "live"} gradient="from-green-50 to-emerald-50" iconBg="from-green-400 to-emerald-500"
            icon={<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L8 8h2l-3 6h2l-4 8h14l-4-8h2l-3-6h2L12 2z" /></svg>}>
            {liveParks.data ? (
              <div className="space-y-3">
                <div className="text-3xl font-black text-gray-900">{liveParks.data.total}</div>
                <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "parks & gardens" : "parku a zahrad"}</div>
                {liveParks.data.parks.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {liveParks.data.parks.slice(0, 3).map((p) => (
                      <div key={p.name} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Sports Card */}
          <Card title={t.sports} source="api.golemio.cz" live={liveSports.status === "live"} gradient="from-orange-50 to-amber-50" iconBg="from-orange-400 to-amber-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 000 20M12 2a14.5 14.5 0 010 20M2 12h20" /></svg>}>
            {liveSports.data ? (
              <div className="space-y-3">
                <div className="text-3xl font-black text-gray-900">{liveSports.data.playgrounds}</div>
                <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "playgrounds & facilities" : "hrist a sportovist"}</div>
                {liveSports.data.facilities.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {liveSports.data.facilities.slice(0, 3).map((f) => (
                      <div key={f.name} className="text-xs text-gray-600 line-clamp-1">{f.name}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Libraries Card */}
          <Card title={t.libraries} source="api.golemio.cz" live={liveLibraries.status === "live"} gradient="from-sky-50 to-blue-50" iconBg="from-sky-400 to-blue-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
            {liveLibraries.data ? (
              <div className="space-y-3">
                <div className="text-3xl font-black text-gray-900">{liveLibraries.data.total}</div>
                <div className="text-xs text-gray-500 font-medium">{lang === "en" ? "libraries" : "knihoven"}</div>
                {liveLibraries.data.libraries.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {liveLibraries.data.libraries.slice(0, 3).map((lib) => (
                      <div key={lib.name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{lib.name}</span>
                        {lib.web && <a href={lib.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline shrink-0 font-medium">Visit</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <Skeleton />}
          </Card>

          {/* Business Card */}
          <Card title={t.business} source="ares.gov.cz" live={liveBusiness.status === "live"} gradient="from-slate-50 to-gray-50" iconBg="from-slate-400 to-gray-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
            {liveBusiness.data ? (
              <div className="space-y-2">
                <div className="text-sm font-bold text-gray-900">{liveBusiness.data.name}</div>
                <div className="text-xs text-gray-500 font-mono">ICO: {liveBusiness.data.ico}</div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">{liveBusiness.data.address}</div>
              </div>
            ) : <Skeleton />}
          </Card>

          {/* City Hall Card */}
          <Card title={t.cityHall} source="api.golemio.cz" live={liveCityHall.status === "live"} gradient="from-indigo-50 to-violet-50" iconBg="from-indigo-400 to-violet-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v4m4-4v4m4-4v4" /></svg>}>
            {liveCityHall.data ? (
              <div className="space-y-2 text-xs">
                {liveCityHall.data.address && (
                  <div className="text-gray-700 leading-relaxed">{liveCityHall.data.address}</div>
                )}
                {liveCityHall.data.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Tel</span>
                    <span className="font-mono text-gray-900 font-medium">{liveCityHall.data.phone}</span>
                  </div>
                )}
                {liveCityHall.data.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Email</span>
                    <span className="text-gray-700">{liveCityHall.data.email}</span>
                  </div>
                )}
                {liveCityHall.data.web && (
                  <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold block mt-1">
                    {liveCityHall.data.web} →
                  </a>
                )}
              </div>
            ) : <Skeleton />}
          </Card>
        </div>

        {/* Premium Wall */}
        <div className="relative mt-16 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 blur-[6px] opacity-40 pointer-events-none select-none">
            {[
              { title: lang === "en" ? "District Budget" : "Rozpocet", color: "from-amber-50 to-yellow-50" },
              { title: lang === "en" ? "Crime Statistics" : "Kriminalita", color: "from-red-50 to-rose-50" },
              { title: lang === "en" ? "Elections" : "Volby", color: "from-blue-50 to-indigo-50" },
              { title: lang === "en" ? "Housing & Rent" : "Bydleni", color: "from-cyan-50 to-sky-50" },
              { title: lang === "en" ? "Employment" : "Zamestnanost", color: "from-fuchsia-50 to-pink-50" },
              { title: lang === "en" ? "Schools" : "Skoly", color: "from-teal-50 to-emerald-50" },
            ].map((item) => (
              <div key={item.title} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 shadow-md`}>
                <div className="text-sm font-bold text-gray-900 mb-3">{item.title}</div>
                <div className="h-4 bg-gray-200/50 rounded-full w-3/4 mb-2.5" />
                <div className="h-4 bg-gray-200/50 rounded-full w-1/2 mb-2.5" />
                <div className="h-4 bg-gray-200/50 rounded-full w-2/3" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center max-w-md mx-4 border border-indigo-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">{t.unlockTitle}</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">{t.unlockDesc}</p>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold py-3.5 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300">
                {t.unlockBtn}
              </button>
              <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">{t.locked}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/80 backdrop-blur-sm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">FP</span>
            </div>
            <span className="text-sm font-bold text-gray-900">ForThePeople</span>
            <span className="text-sm font-bold text-indigo-600">.cz</span>
          </div>
          <div className="text-xs text-gray-400 text-center">
            {lang === "en" ? "Open civic data for Prague's 22 districts" : "Otevrena obcanska data pro 22 prazskych mestskych casti"}
          </div>
          <a href="/sources" className="text-xs text-indigo-600 hover:underline font-semibold">
            {t.sources} →
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ title, source, live, gradient, iconBg, icon, children }: {
  title: string;
  source: string;
  live: boolean;
  gradient: string;
  iconBg: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border border-white/60`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-sm`}>
            {icon}
          </div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-[10px] text-gray-400 font-medium">{source}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const bgMap: Record<string, string> = {
    emerald: "bg-emerald-100/70",
    teal: "bg-teal-100/70",
  };
  return (
    <div className={`${bgMap[color] || "bg-gray-100"} rounded-xl p-3 text-center`}>
      <div className="text-xl font-black text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 bg-white/50 rounded-xl w-1/3" />
      <div className="h-3 bg-white/50 rounded-lg w-2/3" />
      <div className="h-3 bg-white/50 rounded-lg w-1/2" />
    </div>
  );
}
