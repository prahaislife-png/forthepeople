"use client";

import { useState, useEffect } from "react";
import { DISTRICTS, getDistrict } from "./data/districts";

interface LiveState<T> {
  status: "live" | "loading" | "error";
  data: T | null;
  fetchedAt: string | null;
  source?: string;
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
        setState({ status: json.status === "live" ? "live" : "error", data: json.data, fetchedAt: json.fetchedAt, source: json.source });
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
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M CZK`;
  if (n >= 1_000) return `${Math.round(n / 1000)}k CZK`;
  return `${n} CZK`;
}

export default function Page() {
  const [districtId, setDistrictId] = useState(7);
  const [showPanel, setShowPanel] = useState(false);
  const d = getDistrict(districtId);

  const liveWeather = useLiveData<{ temperature: number; windspeed: number; description: string }>("/api/data/weather");
  const liveAir = useLiveData<{ pm25: number; pm10: number; no2: number; o3: number; aqi: number; status: string }>("/api/data/air");
  const liveTransit = useLiveData<{ title: string; link: string; pubDate: string; description: string }[]>("/api/data/transit");
  const liveContracts = useLiveData<{ id: string; supplier: string; subject: string; value: number; date: string }[]>(`/api/data/contracts?district=${districtId}`);
  const liveHealth = useLiveData<{ pharmacies: number; gps: number; specialists: number; hospitals: number; total: number; facilities: { name: string; type: string; address: string }[] }>(`/api/data/health?district=${districtId}`);
  const liveWaste = useLiveData<{ stations: number; containers: number; types: Record<string, number>; monitoredContainers: number }>(`/api/data/waste?district=${districtId}`);
  const liveParks = useLiveData<{ total: number; parks: { name: string; description: string }[] }>(`/api/data/parks?district=${districtId}`);
  const liveSports = useLiveData<{ playgrounds: number; facilities: { name: string; address: string }[] }>(`/api/data/sports?district=${districtId}`);
  const liveLibraries = useLiveData<{ total: number; libraries: { name: string; address: string; web?: string }[] }>(`/api/data/libraries?district=${districtId}`);
  const liveBusiness = useLiveData<{ ico: string; name: string; legalForm: string; address: string }>(`/api/data/business?district=${districtId}`);
  const liveCityHall = useLiveData<{ name: string; address: string; phone?: string; email?: string; web?: string }>(`/api/data/cityhall?district=${districtId}`);
  const liveBudget = useLiveData<{ source: string; year?: number; totalRevenue?: number; totalExpenditure?: number; surplus?: number; summary?: string }>(`/api/data/budget?district=${districtId}`);
  const liveCrime = useLiveData<{ source: string; total?: number; change?: number; summary?: string }>(`/api/data/crime?district=${districtId}`);
  const liveElections = useLiveData<{ source: string; lastElection?: string; turnout?: number; seats?: number; parties?: { name: string; votes: number; seats: number; pct: number }[]; summary?: string }>(`/api/data/elections?district=${districtId}`);
  const liveHousing = useLiveData<{ source: string; avgRentM2?: number; avgSaleM2?: number; municipalUnits?: number; vacancyRate?: number; summary?: string }>(`/api/data/housing?district=${districtId}`);
  const liveEmployment = useLiveData<{ source: string; unemploymentRate?: number; jobseekers?: number; avgSalary?: number; topEmployers?: string[]; summary?: string }>(`/api/data/employment?district=${districtId}`);
  const liveSchools = useLiveData<{ source: string; primary?: number; secondary?: number; kindergarten?: number; universities?: number; total?: number; summary?: string }>(`/api/data/schools?district=${districtId}`);
  const liveTenders = useLiveData<{ source: string; id?: string; title?: string; estimatedValue?: number; status?: string }[]>(`/api/data/tenders?district=${districtId}`);
  const liveEnergy = useLiveData<{ heatPriceGJ: number; electricityPriceKWh: number; gasPrice: number; renewableShare: number }>(`/api/data/energy?district=${districtId}`);
  const liveWater = useLiveData<{ hardness: string; ph: number; nitrates: number; chlorine: number; rating: string; lastTest: string }>(`/api/data/water?district=${districtId}`);
  const liveNoise = useLiveData<{ dayAvgDb: number; nightAvgDb: number; mainSources: string[]; exceedancePercent: number }>(`/api/data/noise?district=${districtId}`);
  const liveEUFunds = useLiveData<{ totalProjects: number; totalFunding: number; projects: { name: string; fund: string; amount: number; status: string }[] }>(`/api/data/eufunds?district=${districtId}`);
  const livePermits = useLiveData<{ total2024: number; pending: number; approved: number; recent: { address: string; type: string; status: string; date: string }[] }>(`/api/data/permits?district=${districtId}`);
  const liveParking = useLiveData<{ total: number; freeSpaces: number; takenSpaces: number; totalCapacity: number; lots: { name: string; free: number; total: number; address: string }[] }>(`/api/data/parking?district=${districtId}`);
  const liveCycling = useLiveData<{ counters: number; todayTotal: number; locations: { name: string; count: number }[] }>(`/api/data/cycling?district=${districtId}`);
  const liveExchange = useLiveData<{ date: string; eur: number; usd: number; gbp: number; rates: { code: string; country: string; amount: number; rate: number }[] }>("/api/data/exchange");
  const liveForeigners = useLiveData<{ total: number; percentOfPopulation: number; topNationalities: { country: string; count: number }[]; euCitizens: number; nonEuCitizens: number }>(`/api/data/foreigners?district=${districtId}`);
  const liveSocial = useLiveData<{ seniorHomes: number; shelters: number; counselingCenters: number; totalProviders: number; services: { name: string; type: string }[] }>(`/api/data/social?district=${districtId}`);
  const liveChildcare = useLiveData<{ kindergartens: number; totalCapacity: number; waitlistRate: number; facilities: { name: string; capacity: number }[] }>(`/api/data/childcare?district=${districtId}`);
  const liveCulture = useLiveData<{ theaters: number; galleries: number; cinemas: number; culturalCenters: number; venues: { name: string; type: string }[] }>(`/api/data/culture?district=${districtId}`);
  const liveTourism = useLiveData<{ annualVisitors: number; hotels: number; airbnbs: number; topAttractions: { name: string; visitors: number }[] }>(`/api/data/tourism?district=${districtId}`);
  const liveCoworking = useLiveData<{ total: number; spaces: { name: string; address: string; priceFrom: number }[] }>(`/api/data/coworking?district=${districtId}`);
  const liveHolidays = useLiveData<{ nextHoliday: { name: string; date: string; daysUntil: number }; upcoming: { name: string; date: string }[]; totalPerYear: number }>("/api/data/holidays");
  const liveInternet = useLiveData<{ avgDownload: number; avgUpload: number; fiberCoverage: number; providers: { name: string; maxSpeed: number; monthlyPrice: number }[] }>(`/api/data/internet?district=${districtId}`);

  const allFetchedAts = [liveWeather, liveAir, liveTransit, liveContracts, liveHealth, liveWaste, liveParks, liveSports, liveLibraries, liveBusiness, liveCityHall, liveBudget, liveCrime, liveElections, liveHousing, liveEmployment, liveSchools, liveTenders, liveEnergy, liveWater, liveNoise, liveEUFunds, livePermits, liveParking, liveCycling, liveExchange, liveForeigners, liveSocial, liveChildcare, liveCulture, liveTourism, liveCoworking, liveHolidays, liveInternet]
    .map((s) => s.fetchedAt).filter(Boolean) as string[];
  const latestUpdate = allFetchedAts.length > 0 ? allFetchedAts.sort().reverse()[0] : null;
  const liveCount = [liveContracts, liveHealth, liveTransit, liveWaste, liveParks, liveSports, liveLibraries, liveBusiness, liveCityHall, liveBudget, liveCrime, liveElections, liveHousing, liveEmployment, liveSchools, liveTenders, liveEnergy, liveWater, liveNoise, liveEUFunds, livePermits, liveParking, liveCycling, liveExchange, liveForeigners, liveSocial, liveChildcare, liveCulture, liveTourism, liveCoworking, liveHolidays, liveInternet].filter(s => s.status === "live").length;

  return (
    <div className="min-h-screen bg-[#fefcf9] flex">
      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 bg-[#fefcf9]/95 backdrop-blur-sm border-b border-[#e8e4dc]">
          <div className="px-4 sm:px-5 h-11 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-sm font-extrabold text-[#3d4f3d]">ForThePeople<span className="text-[#6b7f5a]">.cz</span></a>
              <span className="text-[10px] text-[#8a7e6b] hidden sm:inline">Open civic data · 22 districts · 33 categories</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              {latestUpdate && (
                <span className="hidden sm:inline text-[#8a7e6b]">
                  <span className="inline-block w-1.5 h-1.5 bg-[#6b7f5a] rounded-full mr-1 animate-pulse" />
                  {liveCount} live · {timeAgo(latestUpdate)}
                </span>
              )}
              <a href="/sources" className="text-[#6b7f5a] hover:underline font-semibold">Sources</a>
              <button onClick={() => setShowPanel(!showPanel)} className="lg:hidden font-bold text-white bg-[#6b7f5a] px-2 py-1 rounded text-[10px]">{d.name}</button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="bg-[#3d4f3d] px-4 sm:px-5 py-5">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{d.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[#b8c9a8]">
            <span><strong className="text-white text-sm">{new Intl.NumberFormat("en").format(d.population)}</strong> residents</span>
            <span><strong className="text-white text-sm">{d.area}</strong> km²</span>
            <span>Mayor: <strong className="text-white">{d.mayor}</strong></span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[#93b37a]">
            {liveWeather.data && <span><strong className="text-white">{liveWeather.data.temperature}°C</strong> {liveWeather.data.description}</span>}
            {liveAir.data && <span>AQI <strong className="text-white">{liveAir.data.aqi}</strong> · PM2.5 <strong className="text-white">{liveAir.data.pm25}</strong></span>}
            {liveTransit.data && <span><strong className="text-white">{liveTransit.data.length}</strong> transit alerts</span>}
          </div>
        </div>

        {/* Grid */}
        <main className="px-3 sm:px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">

            <Tile title="Public Contracts" source={liveContracts.source}>
              {liveContracts.data && liveContracts.data.length > 0 ? (
                <>
                  <Big>{liveContracts.data.length}</Big>
                  <Sub>contracts filed</Sub>
                  {liveContracts.data.slice(0, 2).map((c) => (
                    <Row key={c.id} left={c.subject} right={fmtCZK(c.value)} />
                  ))}
                </>
              ) : liveContracts.status === "loading" ? <Skeleton /> : (
                <>
                  <Big>—</Big>
                  <Sub>no recent contracts</Sub>
                </>
              )}
            </Tile>

            <Tile title="Healthcare" source={liveHealth.source}>
              {liveHealth.data ? (
                <>
                  <Big>{liveHealth.data.total}</Big>
                  <Sub>medical facilities</Sub>
                  <div className="flex gap-3 mt-1 text-[10px] text-[#5a5040]">
                    <span><strong className="text-[#3d4f3d]">{liveHealth.data.pharmacies}</strong> pharmacies</span>
                    {liveHealth.data.gps > 0 && <span><strong className="text-[#3d4f3d]">{liveHealth.data.gps}</strong> GPs</span>}
                    {liveHealth.data.specialists > 0 && <span><strong className="text-[#3d4f3d]">{liveHealth.data.specialists}</strong> specialists</span>}
                  </div>
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Transit" source={liveTransit.source}>
              {liveTransit.data && liveTransit.data.length > 0 ? (
                <>
                  <Big>{liveTransit.data.length}</Big>
                  <Sub>active disruptions</Sub>
                  {liveTransit.data.slice(0, 2).map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-[#5a5040] hover:text-[#3d4f3d] truncate mt-0.5">{item.title}</a>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Waste & Recycling" source={liveWaste.source}>
              {liveWaste.data ? (
                <>
                  <div className="flex gap-4 items-end">
                    <div><Big>{liveWaste.data.stations}</Big><Sub>stations</Sub></div>
                    <div><Big>{liveWaste.data.containers}</Big><Sub>containers</Sub></div>
                  </div>
                  <div className="text-[10px] text-[#8a7e6b] mt-1"><strong className="text-[#3d4f3d]">{liveWaste.data.monitoredContainers}</strong> smart-monitored</div>
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Parks" source={liveParks.source}>
              {liveParks.data && liveParks.data.total > 0 ? (
                <>
                  <Big>{liveParks.data.total}</Big>
                  <Sub>green spaces</Sub>
                  {liveParks.data.parks.slice(0, 3).map((p) => (
                    <div key={p.name} className="text-[10px] text-[#5a5040] truncate">{p.name}</div>
                  ))}
                </>
              ) : liveParks.status === "loading" ? <Skeleton /> : d.greenSpace.parks.length > 0 ? (
                <>
                  <Big>{d.greenSpace.parks.length}</Big>
                  <Sub>parks & gardens</Sub>
                  {d.greenSpace.parks.slice(0, 3).map((p) => (
                    <div key={p.name} className="text-[10px] text-[#5a5040] truncate">{p.name}</div>
                  ))}
                </>
              ) : (
                <>
                  <Big>—</Big>
                  <Sub>no park data</Sub>
                </>
              )}
            </Tile>

            <Tile title="Sports" source={liveSports.source}>
              {liveSports.data ? (
                <>
                  <Big>{liveSports.data.playgrounds}</Big>
                  <Sub>playgrounds & courts</Sub>
                  {liveSports.data.facilities.slice(0, 2).map((f) => (
                    <div key={f.name} className="text-[10px] text-[#5a5040] truncate">{f.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Libraries" source={liveLibraries.source}>
              {liveLibraries.data ? (
                <>
                  <Big>{liveLibraries.data.total}</Big>
                  <Sub>public libraries</Sub>
                  {liveLibraries.data.libraries.slice(0, 3).map((lib) => (
                    <div key={lib.name} className="text-[10px] text-[#5a5040] truncate">{lib.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Business Registry" source={liveBusiness.source}>
              {liveBusiness.data ? (
                <>
                  <div className="text-xs font-bold text-[#3d4f3d]">{liveBusiness.data.name}</div>
                  <div className="text-[10px] text-[#8a7e6b] mt-0.5">ICO {liveBusiness.data.ico}</div>
                  <div className="text-[10px] text-[#5a5040] truncate">{liveBusiness.data.address}</div>
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="City Hall" source={liveCityHall.source}>
              {liveCityHall.data ? (
                <div className="space-y-0.5 text-[10px] text-[#5a5040]">
                  {liveCityHall.data.address && <div>{liveCityHall.data.address}</div>}
                  {liveCityHall.data.phone && <div>Tel: <strong>{liveCityHall.data.phone}</strong></div>}
                  {liveCityHall.data.email && <div>{liveCityHall.data.email}</div>}
                  {liveCityHall.data.web && <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-[#6b7f5a] font-semibold">{liveCityHall.data.web}</a>}
                </div>
              ) : <Skeleton />}
            </Tile>

            {/* Budget - fallback to static data */}
            <Tile title="Budget" source={liveBudget.source}>
              {(() => {
                const rev = liveBudget.data?.totalRevenue || d.budget.totalRevenue;
                const exp = liveBudget.data?.totalExpenditure || d.budget.totalExpenditure;
                const surplus = liveBudget.data?.surplus ?? d.budget.surplus;
                return (
                  <>
                    <Big>{fmtCZK(rev * 1_000_000)}</Big>
                    <Sub>annual revenue</Sub>
                    <Row left="Spending" right={fmtCZK(exp * 1_000_000)} />
                    <Row left="Surplus" right={fmtCZK(surplus * 1_000_000)} highlight={surplus >= 0} />
                  </>
                );
              })()}
            </Tile>

            {/* Crime - fallback to static */}
            <Tile title="Crime" source={liveCrime.source}>
              {(() => {
                const total = liveCrime.data?.total || d.crime.total2023;
                const change = liveCrime.data?.change ?? d.crime.change;
                return (
                  <>
                    <Big>{total.toLocaleString()}</Big>
                    <Sub>reported incidents</Sub>
                    <div className={`text-[10px] font-bold mt-0.5 ${change < 0 ? "text-[#6b7f5a]" : "text-red-600"}`}>
                      {change > 0 ? "+" : ""}{typeof change === "number" ? change.toFixed(1) : change}% year-over-year
                    </div>
                  </>
                );
              })()}
            </Tile>

            {/* Elections - fallback to static */}
            <Tile title="Elections" source={liveElections.source}>
              {(() => {
                const turnout = liveElections.data?.turnout || d.elections.turnout;
                const seats = liveElections.data?.seats || d.elections.seats;
                const parties = liveElections.data?.parties || d.elections.coalitions.map(c => ({ name: c.name, votes: 0, seats: c.seats, pct: Math.round(c.seats / seats * 100) }));
                return (
                  <>
                    <div className="flex gap-4 items-end">
                      <div><Big>{turnout}%</Big><Sub>turnout</Sub></div>
                      <div><Big>{seats}</Big><Sub>seats</Sub></div>
                    </div>
                    {parties.slice(0, 3).map((p) => (
                      <Row key={p.name} left={p.name} right={`${p.pct || p.seats} ${p.pct ? "%" : "seats"}`} />
                    ))}
                  </>
                );
              })()}
            </Tile>

            {/* Housing - fallback to static */}
            <Tile title="Housing" source={liveHousing.source}>
              {(() => {
                const rent = liveHousing.data?.avgRentM2 || d.housing.avgRentM2;
                const sale = liveHousing.data?.avgSaleM2 || d.housing.avgSaleM2;
                const vacancy = liveHousing.data?.vacancyRate ?? d.housing.vacancyRate;
                return (
                  <>
                    <Big>{rent} CZK</Big>
                    <Sub>rent per m²/month</Sub>
                    <Row left="Sale price" right={`${sale.toLocaleString()} CZK/m²`} />
                    <Row left="Vacancy" right={`${vacancy}%`} />
                  </>
                );
              })()}
            </Tile>

            {/* Employment - fallback to static */}
            <Tile title="Employment" source={liveEmployment.source}>
              {(() => {
                const rate = liveEmployment.data?.unemploymentRate ?? d.employment.unemploymentRate;
                const salary = liveEmployment.data?.avgSalary || d.employment.avgSalaryCZK;
                const seekers = liveEmployment.data?.jobseekers || d.employment.jobseekers;
                return (
                  <>
                    <Big>{rate}%</Big>
                    <Sub>unemployment</Sub>
                    <Row left="Avg salary" right={`${salary.toLocaleString()} CZK`} />
                    <Row left="Jobseekers" right={seekers.toLocaleString()} />
                  </>
                );
              })()}
            </Tile>

            {/* Schools - fallback to static */}
            <Tile title="Education" source={liveSchools.source}>
              {(() => {
                const kg = liveSchools.data?.kindergarten ?? d.schools.kindergarten;
                const pr = liveSchools.data?.primary ?? d.schools.primary;
                const sec = liveSchools.data?.secondary ?? d.schools.secondary;
                const uni = liveSchools.data?.universities ?? d.schools.universities;
                const total = kg + pr + sec + uni;
                return (
                  <>
                    <Big>{total}</Big>
                    <Sub>schools total</Sub>
                    <div className="flex flex-wrap gap-x-3 text-[10px] text-[#5a5040] mt-0.5">
                      <span><strong>{kg}</strong> kindergartens</span>
                      <span><strong>{pr}</strong> primary</span>
                      <span><strong>{sec}</strong> secondary</span>
                      {uni > 0 && <span><strong>{uni}</strong> universities</span>}
                    </div>
                  </>
                );
              })()}
            </Tile>

            <Tile title="Tenders" source={liveTenders.source}>
              {liveTenders.data && Array.isArray(liveTenders.data) && liveTenders.data.length > 0 ? (
                <>
                  <Big>{liveTenders.data.length}</Big>
                  <Sub>open tenders</Sub>
                  {liveTenders.data.slice(0, 2).map((t, i) => (
                    <Row key={i} left={t.title || "Tender"} right={t.estimatedValue ? fmtCZK(t.estimatedValue) : ""} />
                  ))}
                </>
              ) : liveTenders.status === "loading" ? <Skeleton /> : d.tenders.length > 0 ? (
                <>
                  <Big>{d.tenders.length}</Big>
                  <Sub>public tenders</Sub>
                  {d.tenders.slice(0, 2).map((t) => (
                    <Row key={t.id} left={t.title} right={fmtCZK(t.estimatedValue)} />
                  ))}
                </>
              ) : (
                <>
                  <Big>—</Big>
                  <Sub>no open tenders</Sub>
                </>
              )}
            </Tile>

            <Tile title="Energy" source={liveEnergy.source}>
              {liveEnergy.data ? (
                <>
                  <Big>{liveEnergy.data.heatPriceGJ}</Big>
                  <Sub>CZK/GJ heating</Sub>
                  <Row left="Electricity" right={`${liveEnergy.data.electricityPriceKWh} CZK/kWh`} />
                  <Row left="Renewables" right={`${liveEnergy.data.renewableShare}%`} highlight />
                </>
              ) : (
                <>
                  <Big>{d.energy.heatPriceGJ}</Big>
                  <Sub>CZK/GJ heating</Sub>
                  <Row left="Avg heat bill" right={`${d.energy.avgAnnualHeatBill.toLocaleString()} CZK/yr`} />
                  <Row left="Renewables" right={`${d.energy.renewableShare}%`} highlight />
                </>
              )}
            </Tile>

            <Tile title="Water Quality" source={liveWater.source}>
              {liveWater.data ? (
                <>
                  <Big className="capitalize">{liveWater.data.rating}</Big>
                  <Sub>safety rating</Sub>
                  <Row left="pH" right={String(liveWater.data.ph)} />
                  <Row left="Nitrates" right={`${liveWater.data.nitrates} mg/l`} />
                </>
              ) : (
                <>
                  <Big className="capitalize">{d.water.rating}</Big>
                  <Sub>safety rating</Sub>
                  <Row left="pH" right={String(d.water.ph)} />
                  <Row left="Nitrates" right={`${d.water.nitrates} mg/l`} />
                </>
              )}
            </Tile>

            <Tile title="Demographics" source="https://www.czso.cz">
              <Big>{Math.round(d.population / d.area).toLocaleString()}</Big>
              <Sub>people per km²</Sub>
              <Row left="Population" right={d.population.toLocaleString()} />
              <Row left="Area" right={`${d.area} km²`} />
            </Tile>

            <Tile title="Noise Pollution" source={liveNoise.source || "https://www.geoportalpraha.cz"}>
              {liveNoise.data ? (
                <>
                  <Big>{liveNoise.data.dayAvgDb} dB</Big>
                  <Sub>daytime average</Sub>
                  <Row left="Night avg" right={`${liveNoise.data.nightAvgDb} dB`} />
                  <Row left="Over limit" right={`${liveNoise.data.exceedancePercent}% area`} />
                </>
              ) : (
                <>
                  <Big>{d.noiseMaps.dayAvgDb} dB</Big>
                  <Sub>daytime average</Sub>
                  <Row left="Night avg" right={`${d.noiseMaps.nightAvgDb} dB`} />
                  <Row left="Over limit" right={`${d.noiseMaps.exceedanceAreas}% area`} />
                </>
              )}
            </Tile>

            <Tile title="EU Funds" source={liveEUFunds.source || "https://dotaceeu.cz"}>
              {liveEUFunds.data && liveEUFunds.data.totalProjects > 0 ? (
                <>
                  <Big>{liveEUFunds.data.totalProjects}</Big>
                  <Sub>EU-funded projects</Sub>
                  <Row left="Total funding" right={`${liveEUFunds.data.totalFunding.toLocaleString()} M CZK`} />
                  {liveEUFunds.data.projects[0] && <Row left="Latest" right={liveEUFunds.data.projects[0].name} />}
                </>
              ) : liveEUFunds.status === "loading" ? <Skeleton /> : d.euFunds.length > 0 ? (
                <>
                  <Big>{d.euFunds.length}</Big>
                  <Sub>EU-funded projects</Sub>
                  <Row left="Total funding" right={`${d.euFunds.reduce((s, p) => s + p.amount, 0).toFixed(1)} M CZK`} />
                  {d.euFunds[0] && <Row left="Latest" right={d.euFunds[0].project} />}
                </>
              ) : (
                <>
                  <Big>—</Big>
                  <Sub>no EU fund data</Sub>
                </>
              )}
            </Tile>

            <Tile title="Building Permits" source={livePermits.source || "https://iprpraha.cz"}>
              {livePermits.data && livePermits.data.total2024 > 0 ? (
                <>
                  <Big>{livePermits.data.total2024}</Big>
                  <Sub>permits this year</Sub>
                  <Row left="Pending" right={String(livePermits.data.pending)} />
                  <Row left="Approved" right={String(livePermits.data.approved)} highlight />
                </>
              ) : livePermits.status === "loading" ? <Skeleton /> : d.permits.length > 0 ? (
                <>
                  <Big>{d.permits.length}</Big>
                  <Sub>recent permits</Sub>
                  <Row left="Pending" right={String(d.permits.filter(p => p.status === "pending").length)} />
                  <Row left="Approved" right={String(d.permits.filter(p => p.status === "approved").length)} highlight />
                </>
              ) : (
                <>
                  <Big>—</Big>
                  <Sub>no permit data</Sub>
                </>
              )}
            </Tile>

            <Tile title="Parking" source={liveParking.source || "https://api.golemio.cz/v2/parkings"}>
              {liveParking.data && liveParking.data.total > 0 ? (
                <>
                  <Big>{liveParking.data.freeSpaces}</Big>
                  <Sub>free spaces nearby</Sub>
                  <Row left="P+R lots" right={String(liveParking.data.total)} />
                  <Row left="Total capacity" right={liveParking.data.totalCapacity.toLocaleString()} />
                  <Row left="Occupancy" right={`${liveParking.data.totalCapacity > 0 ? Math.round((liveParking.data.takenSpaces / liveParking.data.totalCapacity) * 100) : 0}%`} />
                </>
              ) : liveParking.status === "loading" ? <Skeleton /> : (
                <>
                  <Big>{d.parking.zone.split("–")[0].trim()}</Big>
                  <Sub>parking zone</Sub>
                  <Row left="Resident permit" right={`${d.parking.residentRate} CZK/yr`} />
                  <Row left="Visitor rate" right={`${d.parking.visitorRate} CZK/hr`} />
                </>
              )}
            </Tile>

            <Tile title="Cycling" source={liveCycling.source || "https://api.golemio.cz/v2/bicyclecounters"}>
              {liveCycling.data && liveCycling.data.counters > 0 ? (
                <>
                  <Big>{liveCycling.data.counters}</Big>
                  <Sub>bike counters nearby</Sub>
                  {liveCycling.data.todayTotal > 0 && <Row left="Today" right={`${liveCycling.data.todayTotal.toLocaleString()} cyclists`} highlight />}
                  {liveCycling.data.locations.slice(0, 2).map((l, i) => (
                    <Row key={i} left={l.name.slice(0, 20)} right={l.count > 0 ? l.count.toLocaleString() : "—"} />
                  ))}
                </>
              ) : liveCycling.status === "loading" ? <Skeleton /> : (
                <>
                  <Big>—</Big>
                  <Sub>no counter data available</Sub>
                </>
              )}
            </Tile>

            <Tile title="Exchange Rates" source="https://www.cnb.cz">
              {liveExchange.data ? (
                <>
                  <Big>{liveExchange.data.eur.toFixed(2)}</Big>
                  <Sub>CZK per EUR</Sub>
                  <Row left="USD" right={`${liveExchange.data.usd.toFixed(2)} CZK`} />
                  <Row left="GBP" right={`${liveExchange.data.gbp.toFixed(2)} CZK`} />
                  <Row left="Updated" right={liveExchange.data.date} />
                </>
              ) : (
                <>
                  <Big>25.10</Big>
                  <Sub>CZK per EUR (est.)</Sub>
                  <Row left="USD" right="22.50 CZK" />
                  <Row left="GBP" right="29.20 CZK" />
                </>
              )}
            </Tile>

            <Tile title="Foreigners" source="https://www.czso.cz">
              {liveForeigners.data ? (
                <>
                  <Big>{liveForeigners.data.total.toLocaleString()}</Big>
                  <Sub>{liveForeigners.data.percentOfPopulation}% of population</Sub>
                  <Row left="EU citizens" right={liveForeigners.data.euCitizens.toLocaleString()} />
                  <Row left="Non-EU" right={liveForeigners.data.nonEuCitizens.toLocaleString()} />
                  {liveForeigners.data.topNationalities.slice(0, 3).map((n, i) => (
                    <Row key={i} left={n.country} right={n.count.toLocaleString()} />
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Social Services" source="https://iregistr.mpsv.cz">
              {liveSocial.data ? (
                <>
                  <Big>{liveSocial.data.totalProviders}</Big>
                  <Sub>service providers</Sub>
                  <Row left="Senior homes" right={String(liveSocial.data.seniorHomes)} />
                  <Row left="Shelters" right={String(liveSocial.data.shelters)} />
                  <Row left="Counseling" right={String(liveSocial.data.counselingCenters)} />
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Childcare" source="https://rejstriky.msmt.cz">
              {liveChildcare.data ? (
                <>
                  <Big>{liveChildcare.data.kindergartens}</Big>
                  <Sub>kindergartens</Sub>
                  <Row left="Total capacity" right={`${liveChildcare.data.totalCapacity} children`} />
                  <Row left="Waitlist rate" right={`${liveChildcare.data.waitlistRate}%`} />
                  {liveChildcare.data.facilities[0] && <Row left="Largest" right={liveChildcare.data.facilities[0].name} />}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Culture & Arts" source="https://www.prague.eu">
              {liveCulture.data ? (
                <>
                  <Big>{liveCulture.data.theaters + liveCulture.data.galleries + liveCulture.data.cinemas + liveCulture.data.culturalCenters}</Big>
                  <Sub>cultural venues</Sub>
                  <Row left="Theaters" right={String(liveCulture.data.theaters)} />
                  <Row left="Galleries" right={String(liveCulture.data.galleries)} />
                  <Row left="Cinemas" right={String(liveCulture.data.cinemas)} />
                  {liveCulture.data.venues[0] && <Row left="Top venue" right={liveCulture.data.venues[0].name} />}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Tourism" source="https://www.czso.cz">
              {liveTourism.data ? (
                <>
                  <Big>{(liveTourism.data.annualVisitors / 1_000_000).toFixed(1)}M</Big>
                  <Sub>visitors per year</Sub>
                  <Row left="Hotels" right={String(liveTourism.data.hotels)} />
                  <Row left="Airbnbs" right={liveTourism.data.airbnbs.toLocaleString()} />
                  {liveTourism.data.topAttractions[0] && <Row left="#1 sight" right={liveTourism.data.topAttractions[0].name} />}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Coworking" source="https://www.coworker.com">
              {liveCoworking.data ? (
                <>
                  <Big>{liveCoworking.data.total}</Big>
                  <Sub>coworking spaces</Sub>
                  {liveCoworking.data.spaces.slice(0, 2).map((s, i) => (
                    <Row key={i} left={s.name} right={`from ${s.priceFrom} CZK`} />
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Public Holidays" source="https://www.mpsv.cz">
              {liveHolidays.data ? (
                <>
                  <Big>{liveHolidays.data.nextHoliday.daysUntil === 0 ? "Today!" : `${liveHolidays.data.nextHoliday.daysUntil}d`}</Big>
                  <Sub>until {liveHolidays.data.nextHoliday.name}</Sub>
                  <Row left="Date" right={liveHolidays.data.nextHoliday.date.slice(5)} />
                  <Row left="Holidays/year" right={String(liveHolidays.data.totalPerYear)} />
                  {liveHolidays.data.upcoming[1] && <Row left="After that" right={liveHolidays.data.upcoming[1].name} />}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Internet & ISP" source="https://www.ctu.cz">
              {liveInternet.data ? (
                <>
                  <Big>{liveInternet.data.avgDownload} Mbps</Big>
                  <Sub>average download speed</Sub>
                  <Row left="Upload" right={`${liveInternet.data.avgUpload} Mbps`} />
                  <Row left="Fiber coverage" right={`${liveInternet.data.fiberCoverage}%`} highlight />
                  {liveInternet.data.providers[0] && <Row left={liveInternet.data.providers[0].name} right={`${liveInternet.data.providers[0].monthlyPrice} CZK/mo`} />}
                </>
              ) : <Skeleton />}
            </Tile>

          </div>
        </main>

        <footer className="border-t border-[#e8e4dc] px-4 sm:px-5 py-4 text-center text-[10px] text-[#8a7e6b]">
          <strong className="text-[#3d4f3d]">ForThePeople<span className="text-[#6b7f5a]">.cz</span></strong> · 33 categories · 22 districts · Click card for source
        </footer>
      </div>

      {/* Right Panel */}
      <aside className="hidden lg:flex flex-col w-40 border-l border-[#e8e4dc] bg-[#faf8f4] sticky top-0 h-screen overflow-y-auto">
        <div className="px-3 py-2 border-b border-[#e8e4dc]">
          <div className="text-[9px] font-bold text-[#8a7e6b] uppercase tracking-wider">District</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {DISTRICTS.map((dist) => (
            <button
              key={dist.id}
              onClick={() => setDistrictId(dist.id)}
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                dist.id === districtId
                  ? "bg-[#3d4f3d] text-white font-bold"
                  : "text-[#5a5040] hover:bg-[#f0ebe3]"
              }`}
            >
              Praha {dist.id}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setShowPanel(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-[#faf8f4] shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-2 border-b border-[#e8e4dc] flex items-center justify-between">
              <span className="text-[9px] font-bold text-[#8a7e6b] uppercase">District</span>
              <button onClick={() => setShowPanel(false)} className="text-[#8a7e6b]">×</button>
            </div>
            {DISTRICTS.map((dist) => (
              <button
                key={dist.id}
                onClick={() => { setDistrictId(dist.id); setShowPanel(false); }}
                className={`w-full text-left px-3 py-2 text-[11px] transition-colors ${
                  dist.id === districtId ? "bg-[#3d4f3d] text-white font-bold" : "text-[#5a5040] hover:bg-[#f0ebe3]"
                }`}
              >
                Praha {dist.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ title, source, children }: { title: string; source?: string | null; children: React.ReactNode }) {
  const [showSrc, setShowSrc] = useState(false);
  return (
    <div className="bg-white rounded border border-[#e8e4dc] p-2.5 hover:border-[#6b7f5a]/50 transition-colors cursor-pointer" onClick={() => source && setShowSrc(!showSrc)}>
      <div className="text-[10px] font-bold text-[#6b7f5a] uppercase tracking-wide mb-1">{title}</div>
      {children}
      {showSrc && source && (
        <div className="mt-1 text-[8px] text-[#6b7f5a] font-mono bg-[#f0ebe3] px-1 py-0.5 rounded inline-block">
          {source.replace("https://", "").replace("http://", "").split("/")[0]}
        </div>
      )}
    </div>
  );
}

function Big({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-2xl font-black text-[#3d4f3d] leading-tight ${className || ""}`}>{children}</div>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] text-[#8a7e6b] mb-1.5">{children}</div>;
}

function Row({ left, right, highlight }: { left: string; right: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-[10px] py-px gap-2">
      <span className="text-[#8a7e6b] truncate">{left}</span>
      <strong className={`shrink-0 ${highlight ? "text-[#6b7f5a]" : "text-[#3d4f3d]"}`}>{right}</strong>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-1.5">
      <div className="h-6 bg-[#f0ebe3] rounded w-1/4" />
      <div className="h-2 bg-[#f0ebe3] rounded w-2/3" />
    </div>
  );
}
