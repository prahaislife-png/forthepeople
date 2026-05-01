const GOLEMIO_BASE = "https://api.golemio.cz/v2";

function getApiKey(): string {
  return process.env.GOLEMIO_API_KEY ?? "";
}

export async function golemioFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${GOLEMIO_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { "X-Access-Token": getApiKey() },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Golemio ${path} returned ${res.status}`);
  return res.json();
}

export interface GolemioFeatureCollection<T> {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: string; coordinates: number[] | number[][] | number[][][] };
    properties: T;
  }>;
}
