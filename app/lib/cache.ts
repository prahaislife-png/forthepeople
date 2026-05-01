import { createClient } from "@supabase/supabase-js";

type CacheEntry<T> = { data: T; fetchedAt: number };

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 15 * 60 * 1000;

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

export function getCacheAge(key: string): number | null {
  const entry = store.get(key);
  if (!entry) return null;
  return Date.now() - entry.fetchedAt;
}

export type LiveStatus = "live" | "demo" | "error";

export interface LiveResponse<T> {
  status: LiveStatus;
  data: T;
  source: string;
  fetchedAt: string;
  error?: string;
}

// --- Supabase persistent layer ---

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

export async function getPersistedData<T>(districtId: number, section: string): Promise<{ data: T; fetchedAt: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("district_data")
      .select("data, fetched_at")
      .eq("district_id", districtId)
      .eq("section", section)
      .single() as { data: { data: unknown; fetched_at: string } | null };
    if (!data) return null;
    return { data: data.data as T, fetchedAt: data.fetched_at };
  } catch {
    return null;
  }
}

export async function persistData(districtId: number, section: string, sectionData: unknown, source: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await (sb.from("district_data") as unknown as { upsert: (values: Record<string, unknown>, opts?: Record<string, unknown>) => Promise<unknown> }).upsert(
      { district_id: districtId, section, data: sectionData, source, fetched_at: new Date().toISOString() },
      { onConflict: "district_id,section" }
    );
  } catch {
    // Silently fail — in-memory cache still works
  }
}
