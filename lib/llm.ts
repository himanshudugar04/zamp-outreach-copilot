import { ANALYST_PROMPT, ANALYST_SCHEMA, WRITER_PROMPT, WRITER_SCHEMA } from "./prompts";
import type { Analysis, Draft } from "./types";

const ANALYST_MODEL = () => process.env.OPENAI_ANALYST_MODEL || "gpt-5.4-mini";
const WRITER_MODEL = () => process.env.OPENAI_WRITER_MODEL || "gpt-5.5";

export interface LlmResult<T> {
  data: T;
  tokens: number;
  model: string;
}

// Warm-instance cache keyed by the exact request: identical inputs never pay twice.
const cache = new Map<string, LlmResult<unknown>>();

async function chatJSON<T>(
  model: string,
  system: string,
  user: unknown,
  schema: object,
  maxTokens: number
): Promise<LlmResult<T>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const payload = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) },
    ],
    response_format: { type: "json_schema", json_schema: schema },
    max_completion_tokens: maxTokens,
    reasoning_effort: "low",
  };
  const cacheKey = JSON.stringify(payload);
  const hit = cache.get(cacheKey);
  if (hit) return { ...(hit as LlmResult<T>), tokens: 0 };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${json?.error?.message || "request failed"}`);
    const choice = json.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      throw new Error(
        choice?.finish_reason === "length"
          ? "OpenAI ran out of output tokens before answering"
          : "OpenAI returned an empty answer"
      );
    }
    const out: LlmResult<T> = {
      data: JSON.parse(content) as T,
      tokens: json.usage?.total_tokens ?? 0,
      model,
    };
    cache.set(cacheKey, out);
    return out;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("OpenAI timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function runAnalyst(input: unknown) {
  // Reasoning tokens count against the cap, so leave headroom.
  return chatJSON<Analysis>(ANALYST_MODEL(), ANALYST_PROMPT, input, ANALYST_SCHEMA, 6000);
}

export function runWriter(input: unknown) {
  return chatJSON<Draft>(WRITER_MODEL(), WRITER_PROMPT, input, WRITER_SCHEMA, 4000);
}

export function clearLlmCache() {
  cache.clear();
}
