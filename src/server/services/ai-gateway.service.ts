/**
 * Thin wrapper around Lovable AI Gateway (OpenAI-compatible /chat/completions).
 *
 * Every AI feature routes through this module. Callers never touch fetch()
 * directly — this centralises: model selection, key handling, JSON-mode
 * prompting, retry-once-on-JSON-parse, request logging, and rate limiting.
 *
 * Keys stay on the server. Browser code MUST call the AI via server
 * functions, never this module.
 */
import { env } from "../env";
import { aiLog } from "./ai-log.service";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_MODEL = "google/gemini-2.5-flash";

function apiKey(): string {
  const key = env().LOVABLE_API_KEY ?? env().AI_API_KEY;
  if (!key) throw new Error("AI_UNCONFIGURED");
  return key;
}

export type AIChatOptions = {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  feature: string; // for logs
  userId?: string;
};

export async function aiChat(opts: AIChatOptions): Promise<string> {
  const started = Date.now();
  const model = opts.model ?? DEFAULT_MODEL;
  try {
    const body: Record<string, unknown> = {
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
    };
    if (opts.jsonMode) body.response_format = { type: "json_object" };

    const res = await fetch(`${env().AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey()}`,
        "Lovable-API-Key": apiKey(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = res.status === 429 ? "RATE_LIMITED" : res.status === 402 ? "CREDITS_EXHAUSTED" : `HTTP_${res.status}`;
      aiLog({ feature: opts.feature, model, userId: opts.userId, ok: false, latencyMs: Date.now() - started, error: err, snippet: text.slice(0, 300) });
      throw new Error(err);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    aiLog({ feature: opts.feature, model, userId: opts.userId, ok: true, latencyMs: Date.now() - started });
    return content;
  } catch (e) {
    if (e instanceof Error && (e.message === "AI_UNCONFIGURED" || e.message.startsWith("HTTP_") || e.message === "RATE_LIMITED" || e.message === "CREDITS_EXHAUSTED")) {
      throw e;
    }
    aiLog({ feature: opts.feature, model, userId: opts.userId, ok: false, latencyMs: Date.now() - started, error: "NETWORK" });
    throw new Error("AI_UNAVAILABLE");
  }
}

/**
 * Ask the model for JSON output. Returns parsed object, or throws AI_BAD_JSON.
 * Strips markdown code fences the model sometimes wraps around JSON.
 */
export async function aiChatJSON<T>(opts: AIChatOptions): Promise<T> {
  const raw = await aiChat({ ...opts, jsonMode: true });
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt to extract the first {...} or [...] block
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // fallthrough
      }
    }
    throw new Error("AI_BAD_JSON");
  }
}

// ------------ Per-user rate limit (in-memory token bucket, 10/min) ------------

type Bucket = { tokens: number; updated: number };
const buckets = new Map<string, Bucket>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: LIMIT, updated: now };
  const elapsed = now - b.updated;
  const refill = (elapsed / WINDOW_MS) * LIMIT;
  b.tokens = Math.min(LIMIT, b.tokens + refill);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.ceil(((1 - b.tokens) / LIMIT) * WINDOW_MS / 1000) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}
