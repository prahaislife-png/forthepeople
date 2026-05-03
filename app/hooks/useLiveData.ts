"use client";

import { useState, useEffect, useRef } from "react";

export interface LiveState<T> {
  status: "live" | "loading" | "error";
  data: T | null;
  fetchedAt: string | null;
  source?: string;
}

export interface BulkData {
  [key: string]: {
    status: string;
    data: unknown;
    source?: string;
    fetchedAt?: string;
  };
}

// Client-side cache: once fetched, a district's data stays in memory
const districtCache = new Map<number, BulkData>();

const GLOBAL_KEYS = ["weather", "air", "transit", "exchange", "holidays"];

export function useBulkData(districtId: number): { data: BulkData | null; loading: boolean } {
  const [data, setData] = useState<BulkData | null>(() => districtCache.get(districtId) || null);
  const [loading, setLoading] = useState(!districtCache.has(districtId));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cached = districtCache.get(districtId);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setData(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/data/bulk?district=${districtId}`, { signal: controller.signal })
      .then(r => r.json())
      .then((json: BulkData) => {
        districtCache.set(districtId, json);
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setLoading(false);
        }
      });

    return () => { controller.abort(); };
  }, [districtId]);

  return { data, loading };
}

// Prefetch adjacent districts in background for instant switching
export function usePrefetch(currentDistrictId: number) {
  const prefetchedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const toPrefetch = [
      currentDistrictId - 1,
      currentDistrictId + 1,
      currentDistrictId + 2,
    ].filter(id => id >= 1 && id <= 22 && !districtCache.has(id) && !prefetchedRef.current.has(id));

    const timeout = setTimeout(() => {
      for (const id of toPrefetch) {
        prefetchedRef.current.add(id);
        fetch(`/api/data/bulk?district=${id}`)
          .then(r => r.json())
          .then((json: BulkData) => { districtCache.set(id, json); })
          .catch(() => {});
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [currentDistrictId]);
}

// Extract a single section from bulk data
export function extractSection<T>(bulk: BulkData | null, key: string): LiveState<T> {
  if (!bulk || !bulk[key]) return { status: "loading", data: null, fetchedAt: null };
  const section = bulk[key];
  return {
    status: section.status === "live" ? "live" : section.status === "error" ? "error" : "loading",
    data: section.data as T | null,
    fetchedAt: (section.fetchedAt as string) || null,
    source: section.source,
  };
}

// Keep old hook for any standalone usage
export function useLiveData<T>(url: string | null): LiveState<T> {
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

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function fmtCZK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M CZK`;
  if (n >= 1_000) return `${Math.round(n / 1000)}k CZK`;
  return `${n} CZK`;
}
