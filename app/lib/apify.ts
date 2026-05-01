const APIFY_BASE = "https://api.apify.com/v2";

function getToken(): string {
  return process.env.APIFY_API_TOKEN ?? "";
}

export async function runActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const token = getToken();
  if (!token) throw new Error("APIFY_API_TOKEN not set");

  const runRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${token}&waitForFinish=120`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(180000),
  });

  if (!runRes.ok) throw new Error(`Apify actor ${actorId} failed: ${runRes.status}`);
  const run = await runRes.json();

  const datasetId = run.data?.defaultDatasetId;
  if (!datasetId) throw new Error("No dataset returned from actor run");

  const dataRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!dataRes.ok) throw new Error(`Failed to fetch dataset ${datasetId}`);
  return dataRes.json();
}

export async function getLastDataset<T>(actorId: string): Promise<T[] | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${APIFY_BASE}/acts/${actorId}/runs/last/dataset/items?token=${token}&format=json&status=SUCCEEDED`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return null;
  return res.json();
}
