const BASE = "https://api.crustdata.com";

export class CrustdataError extends Error {
  constructor(public status: number, message: string, public path: string) {
    super(message);
  }
}

export interface CallResult<T> {
  data: T;
  credits: number;
}

// Warm-instance cache: repeated demo runs on the same server cost nothing.
const cache = new Map<string, { at: number; value: CallResult<unknown> }>();
const TTL_MS = 6 * 60 * 60 * 1000;

export async function crust<T = any>(path: string, body: unknown, timeoutMs = 25000): Promise<CallResult<T>> {
  const key = process.env.CRUSTDATA_API_KEY;
  if (!key) throw new CrustdataError(500, "CRUSTDATA_API_KEY is not set", path);

  const cacheKey = path + ":" + JSON.stringify(body);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return { data: hit.value.data as T, credits: 0 };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "x-api-version": "2025-11-01",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const credits = Number(res.headers.get("x-credits-used") || 0);
    const text = await res.text();
    if (!res.ok) {
      let msg = text.slice(0, 300);
      try {
        const j = JSON.parse(text);
        msg = j?.error?.message || j?.message || msg;
      } catch {}
      throw new CrustdataError(res.status, msg, path);
    }
    const data = JSON.parse(text) as T;
    const value = { data, credits };
    cache.set(cacheKey, { at: Date.now(), value });
    return value;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new CrustdataError(504, "Crustdata timed out", path);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- filter helpers ----------
export const f = (field: string, type: string, value: unknown) => ({ field, type, value });
export const and = (...conditions: unknown[]) => ({ op: "and", conditions });
export const or = (...conditions: unknown[]) => ({ op: "or", conditions });

export function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
}

export function ageInDays(date?: string | null): number | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 864e5));
}

export function clearCrustCache() {
  cache.clear();
}
