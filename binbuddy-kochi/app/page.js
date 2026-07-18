"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import sampleBins from "../data/bins.json";

const BinMap = dynamic(() => import("../components/Map"), { ssr: false, loading: () => <div className="h-[440px] animate-pulse bg-emerald-100" /> });
const AUTHORITY_BINS_KEY = "binbuddy-authority-bins";
const FULL_REPORTS_KEY = "binbuddy-full-reports";
const places = {
  "Lulu Mall": { latitude: 10.0274, longitude: 76.3089 }, "Edappally Metro": { latitude: 10.0265, longitude: 76.3082 }, "Vyttila Mobility Hub": { latitude: 9.9682, longitude: 76.3217 }, "Marine Drive": { latitude: 9.9819, longitude: 76.2786 }, "Fort Kochi": { latitude: 9.9661, longitude: 76.2427 }, Kakkanad: { latitude: 10.0162, longitude: 76.3525 }, Kaloor: { latitude: 9.9942, longitude: 76.2927 }, "MG Road": { latitude: 9.9788, longitude: 76.2864 },
};
const locationNames = Object.keys(places);
const wasteTypes = [{ name: "Plastic", key: "plastic", icon: "♻" }, { name: "Food waste", key: "food", icon: "🍌" }, { name: "Paper", key: "paper", icon: "▤" }, { name: "General waste", key: "general", icon: "🗑" }];
const emptyAuthorityForm = { name: "", latitude: "", longitude: "", wasteTypes: ["plastic"], status: "available", official: true };

function distanceToRouteInKilometres(point, route) {
  if (route.length < 2) return Infinity;
  const latitudeScale = 110.574;
  const longitudeScale = 111.32 * Math.cos((point.latitude * Math.PI) / 180);
  let closestDistance = Infinity;
  for (let index = 0; index < route.length - 1; index += 1) {
    const [startLatitude, startLongitude] = route[index]; const [endLatitude, endLongitude] = route[index + 1];
    const pointX = (point.longitude - startLongitude) * longitudeScale; const pointY = (point.latitude - startLatitude) * latitudeScale;
    const segmentX = (endLongitude - startLongitude) * longitudeScale; const segmentY = (endLatitude - startLatitude) * latitudeScale;
    const lengthSquared = segmentX ** 2 + segmentY ** 2;
    const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (pointX * segmentX + pointY * segmentY) / lengthSquared));
    closestDistance = Math.min(closestDistance, Math.hypot(pointX - progress * segmentX, pointY - progress * segmentY));
  }
  return closestDistance;
}

export default function Home() {
  const [from, setFrom] = useState("Lulu Mall"); const [to, setTo] = useState("Marine Drive"); const [selectedWaste, setSelectedWaste] = useState("plastic");
  const [route, setRoute] = useState([]); const [isLoadingRoute, setIsLoadingRoute] = useState(false); const [routeError, setRouteError] = useState(""); const [hasSearched, setHasSearched] = useState(false);
  const [authorityBins, setAuthorityBins] = useState([]); const [fullReports, setFullReports] = useState({}); const [isAuthorityOpen, setIsAuthorityOpen] = useState(false); const [authorityForm, setAuthorityForm] = useState(emptyAuthorityForm); const [authorityError, setAuthorityError] = useState("");

  useEffect(() => {
    const loadStoredDemoData = window.setTimeout(() => {
      try {
        const savedBins = JSON.parse(localStorage.getItem(AUTHORITY_BINS_KEY) || "[]");
        const savedReports = JSON.parse(localStorage.getItem(FULL_REPORTS_KEY) || "{}");
        if (Array.isArray(savedBins)) setAuthorityBins(savedBins);
        if (savedReports && typeof savedReports === "object") setFullReports(savedReports);
      } catch { /* Prototype storage can be reset safely. */ }
    }, 0);
    return () => window.clearTimeout(loadStoredDemoData);
  }, []);

  const allBins = useMemo(() => [...sampleBins, ...authorityBins].map((bin) => ({ ...bin, status: fullReports[bin.id] ? "full" : bin.status })), [authorityBins, fullReports]);
  const results = useMemo(() => {
    if (route.length < 2) return [];
    return allBins.filter((bin) => bin.wasteTypes.includes(selectedWaste)).map((bin) => ({ ...bin, routeDistance: distanceToRouteInKilometres(bin, route) })).sort((first, second) => {
      if (first.status === "full" && second.status !== "full") return 1;
      if (first.status !== "full" && second.status === "full") return -1;
      return first.routeDistance - second.routeDistance;
    });
  }, [allBins, route, selectedWaste]);

  async function findBinsOnRoute() {
    const startPoint = places[from]; const destinationPoint = places[to];
    setIsLoadingRoute(true); setRouteError(""); setHasSearched(true);
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startPoint.longitude},${startPoint.latitude};${destinationPoint.longitude},${destinationPoint.latitude}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error("Route request failed");
      const data = await response.json();
      const routeCoordinates = data.routes?.[0]?.geometry?.coordinates?.map(([longitude, latitude]) => [latitude, longitude]);
      if (!routeCoordinates?.length) throw new Error("No route found");
      setRoute(routeCoordinates);
      document.getElementById("route-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch { setRoute([]); setRouteError("We could not build this route right now. Please try again."); } finally { setIsLoadingRoute(false); }
  }

  function reportBinFull(binId) {
    setFullReports((current) => {
      const next = { ...current, [binId]: new Date().toISOString() };
      localStorage.setItem(FULL_REPORTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function toggleAuthorityWasteType(wasteType) {
    setAuthorityForm((current) => ({ ...current, wasteTypes: current.wasteTypes.includes(wasteType) ? current.wasteTypes.filter((type) => type !== wasteType) : [...current.wasteTypes, wasteType] }));
  }

  function saveAuthorityBin(event) {
    event.preventDefault();
    const latitude = Number(authorityForm.latitude); const longitude = Number(authorityForm.longitude);
    if (!authorityForm.name.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || authorityForm.wasteTypes.length === 0) { setAuthorityError("Add a name, valid coordinates, and at least one waste type."); return; }
    const newBin = { id: `authority-${Date.now()}`, name: authorityForm.name.trim(), latitude, longitude, wasteTypes: authorityForm.wasteTypes, status: authorityForm.status, verified: authorityForm.official, official: authorityForm.official, lastReported: new Date().toISOString().slice(0, 10) };
    setAuthorityBins((current) => { const next = [...current, newBin]; localStorage.setItem(AUTHORITY_BINS_KEY, JSON.stringify(next)); return next; });
    setAuthorityForm(emptyAuthorityForm); setAuthorityError(""); setIsAuthorityOpen(false);
  }

  const start = { name: from, ...places[from] }; const destination = { name: to, ...places[to] }; const bestBinId = results.find((bin) => bin.status === "available")?.id;

  return <main className="min-h-screen bg-[#f7faf7] text-slate-800">
    <section className="relative overflow-hidden bg-emerald-700 px-5 pb-16 pt-5 sm:px-8 sm:pb-20 lg:px-16"><div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" /><div className="relative mx-auto max-w-5xl">
      <header className="flex items-center justify-between gap-3 text-white"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl text-emerald-700 shadow-sm" aria-hidden="true">♻</span><div><p className="text-lg font-bold tracking-tight">BinBuddy Kochi</p><p className="text-sm text-emerald-100">Find the right bin on your way.</p></div></div><button type="button" onClick={() => setIsAuthorityOpen(true)} className="rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Authority portal</button></header>
      <div className="mt-10 max-w-3xl sm:mt-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Route bin finder</p><h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">Don&apos;t carry waste till you find a road to throw it on. Find the right bin on the way.</h1></div>
      <div className="mt-7 rounded-2xl bg-white p-5 shadow-xl shadow-emerald-950/20 sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">From<select value={from} onChange={(event) => setFrom(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">{locationNames.map((name) => <option key={name}>{name}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">To<select value={to} onChange={(event) => setTo(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">{locationNames.map((name) => <option key={name}>{name}</option>)}</select></label></div><fieldset className="mt-6"><legend className="text-sm font-semibold text-slate-700">What waste do you have?</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{wasteTypes.map((waste) => { const isSelected = selectedWaste === waste.key; return <button key={waste.key} type="button" onClick={() => setSelectedWaste(waste.key)} aria-pressed={isSelected} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${isSelected ? "border-emerald-600 bg-emerald-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"}`}><span className="mr-2" aria-hidden="true">{waste.icon}</span>{waste.name}</button>; })}</div></fieldset><button type="button" onClick={findBinsOnRoute} disabled={isLoadingRoute} className="mt-7 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-500">{isLoadingRoute ? "Finding your route..." : "Find the right bin"}</button>{routeError && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900" role="alert">{routeError}</p>}</div>
    </div></section>

    <section id="route-map" className="scroll-mt-5 px-5 py-14 sm:px-8 lg:px-16"><div className="mx-auto max-w-5xl"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Your route</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Bins on the way</h2><p className="mt-2 text-slate-600">Green pins are available, yellow pins are unknown, and red pins are full.</p></div><div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><BinMap route={route} start={hasSearched ? start : null} destination={hasSearched ? destination : null} bins={results} onReportFull={reportBinFull} /></div>
      {hasSearched && <section className="mt-8" aria-labelledby="best-bins-heading"><h3 id="best-bins-heading" className="text-xl font-bold text-slate-900">Best bins on your route</h3><p className="mt-1 text-sm text-slate-600">Matching bins are sorted by status and distance from your route.</p>{results.length > 0 ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{results.map((bin) => <li key={bin.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-slate-900">{bin.name}</h4>{bin.official && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Official</span>}</div>{bin.id === bestBinId && <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Best choice</span>}</div><p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-700">Accepts:</span> {bin.wasteTypes.join(", ")}</p><p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-slate-700">Status:</span> {bin.status}</p><p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-slate-700">From your route:</span> {Math.round(bin.routeDistance * 1000)} m</p></li>)}</ul> : !routeError && <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">No sample bins match this waste type.</p>}</section>}
    </div></section>
    <footer className="bg-slate-900 px-5 py-8 text-sm text-slate-300 sm:px-8 lg:px-16"><div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:justify-between"><p className="font-semibold text-white">BinBuddy Kochi</p><p>Cleaner streets, one bin at a time.</p></div></footer>

    {isAuthorityOpen && <div className="fixed inset-0 z-[1000] flex items-end bg-slate-950/50 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="authority-title"><form onSubmit={saveAuthorityBin} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 id="authority-title" className="text-2xl font-bold text-slate-900">Authority portal</h2><p className="mt-2 text-sm text-slate-600">Add a bin to this browser only. It is not connected to any government system.</p></div><button type="button" onClick={() => setIsAuthorityOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close authority portal">×</button></div><label className="mt-6 block text-sm font-semibold text-slate-700">Bin name<input value={authorityForm.name} onChange={(event) => setAuthorityForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" placeholder="Example: Market entrance bin" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Latitude<input type="number" step="any" value={authorityForm.latitude} onChange={(event) => setAuthorityForm((current) => ({ ...current, latitude: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" placeholder="9.9819" /></label><label className="text-sm font-semibold text-slate-700">Longitude<input type="number" step="any" value={authorityForm.longitude} onChange={(event) => setAuthorityForm((current) => ({ ...current, longitude: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" placeholder="76.2786" /></label></div><fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">Waste types accepted</legend><div className="mt-2 grid grid-cols-2 gap-2">{wasteTypes.map((waste) => <label key={waste.key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-sm"><input type="checkbox" checked={authorityForm.wasteTypes.includes(waste.key)} onChange={() => toggleAuthorityWasteType(waste.key)} />{waste.name}</label>)}</div></fieldset><label className="mt-5 block text-sm font-semibold text-slate-700">Status<select value={authorityForm.status} onChange={(event) => setAuthorityForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"><option value="available">Available</option><option value="full">Full</option><option value="unknown">Unknown</option></select></label><label className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={authorityForm.official} onChange={(event) => setAuthorityForm((current) => ({ ...current, official: event.target.checked }))} />Official verified bin</label>{authorityError && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-900">{authorityError}</p>}<button type="submit" className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white transition hover:bg-emerald-700">Save bin to this browser</button></form></div>}
  </main>;
}
