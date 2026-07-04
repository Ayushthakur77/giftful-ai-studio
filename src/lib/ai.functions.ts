/**
 * Public AI server functions.
 *
 * All AI calls to the browser cross this boundary. Keys stay on the
 * server. Every function is rate-limited per user (or per IP for
 * guests) and returns a graceful `{ ok: false, error }` shape when
 * anything fails so the UI can degrade instead of crashing.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SESSION_COOKIE = "giftty_session";

async function getUserId(): Promise<string | null> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  try {
    const { authService } = await import("@/server/services/auth.service");
    const me = await authService.me(token);
    return me?.id ?? null;
  } catch {
    return null;
  }
}

async function requireSlot(feature: string): Promise<{ userKey: string }> {
  const uid = await getUserId();
  const key = `${feature}:${uid ?? "guest"}`;
  const { rateLimit } = await import("@/server/services/ai-gateway.service");
  const gate = rateLimit(key);
  if (!gate.ok) throw new Response(`Rate limited. Retry in ${gate.retryAfter}s.`, { status: 429 });
  return { userKey: uid ?? "guest" };
}

// ---------- Assistant ----------

const recommendInput = z.object({
  query: z.string().trim().min(2).max(500),
  occasion: z.string().max(60).optional(),
  relationship: z.string().max(60).optional(),
  budgetPaise: z.number().int().min(0).max(100_000_00).optional(),
  tone: z.string().max(60).optional(),
});

export const aiRecommendFn = createServerFn({ method: "POST" })
  .inputValidator((d) => recommendInput.parse(d))
  .handler(async ({ data }) => {
    const { isEnabled } = await import("@/server/services/ai-settings.service");
    if (!isEnabled("assistant")) return { ok: false as const, error: "AI assistant is disabled." };
    try {
      await requireSlot("assistant");
      const uid = await getUserId();
      const { recommendGifts } = await import("@/server/services/ai-recommend.service");
      const result = await recommendGifts({ ...data, userId: uid ?? undefined });
      return { ok: true as const, ...result };
    } catch (e) {
      return { ok: false as const, error: friendly(e) };
    }
  });

// ---------- Gift Box Builder ----------

const buildInput = z.object({
  occasion: z.string().max(60).optional(),
  relationship: z.string().max(60).optional(),
  budgetPaise: z.number().int().min(0).max(100_000_00).optional(),
  preferences: z.string().max(500).optional(),
});

export const aiBuildBoxFn = createServerFn({ method: "POST" })
  .inputValidator((d) => buildInput.parse(d))
  .handler(async ({ data }) => {
    const { isEnabled } = await import("@/server/services/ai-settings.service");
    if (!isEnabled("builder")) return { ok: false as const, error: "AI gift-box builder is disabled." };
    try {
      await requireSlot("builder");
      const uid = await getUserId();
      const { buildGiftBox } = await import("@/server/services/ai-recommend.service");
      const draft = await buildGiftBox({ ...data, userId: uid ?? undefined });
      return { ok: true as const, draft };
    } catch (e) {
      return { ok: false as const, error: friendly(e) };
    }
  });

// ---------- Greeting Card ----------

const greetInput = z.object({
  occasion: z.string().max(60).optional(),
  recipient: z.string().max(60).optional(),
  relationship: z.string().max(60).optional(),
  tone: z.enum(["heartfelt", "funny", "professional", "romantic", "formal", "short", "poetic"]).optional(),
  language: z.enum(["English", "Hindi", "Hinglish"]).optional(),
  maxChars: z.number().int().min(40).max(500).optional(),
});

export const aiGreetingFn = createServerFn({ method: "POST" })
  .inputValidator((d) => greetInput.parse(d))
  .handler(async ({ data }) => {
    const { isEnabled } = await import("@/server/services/ai-settings.service");
    if (!isEnabled("greeting")) return { ok: false as const, error: "AI greeting generator is disabled." };
    try {
      await requireSlot("greeting");
      const uid = await getUserId();
      const { generateGreeting } = await import("@/server/services/ai-greeting.service");
      const message = await generateGreeting({ ...data, userId: uid ?? undefined });
      return { ok: true as const, message };
    } catch (e) {
      return { ok: false as const, error: friendly(e) };
    }
  });

// ---------- Natural-language search ----------

const searchInput = z.object({ q: z.string().trim().min(2).max(200) });

export const aiSearchFn = createServerFn({ method: "POST" })
  .inputValidator((d) => searchInput.parse(d))
  .handler(async ({ data }) => {
    const { isEnabled } = await import("@/server/services/ai-settings.service");
    if (!isEnabled("search")) return { ok: false as const, error: "AI search is disabled." };
    try {
      await requireSlot("search");
      const uid = await getUserId();
      const { aiSearch } = await import("@/server/services/ai-search.service");
      const { results, interpretation } = await aiSearch(data.q, uid ?? undefined);
      return {
        ok: true as const,
        interpretation,
        results: results.map((r) => ({
          slug: r.product.slug,
          name: r.product.name,
          image: r.product.image,
          pricePaise: r.product.pricePaise,
          mrpPaise: r.product.mrpPaise,
          reason: r.reason,
        })),
      };
    } catch (e) {
      return { ok: false as const, error: friendly(e) };
    }
  });

// ---------- Dynamic homepage ----------

const homeInput = z.object({
  wishlistSlugs: z.array(z.string().max(120)).max(50).optional(),
  recentSlugs: z.array(z.string().max(120)).max(50).optional(),
});

export const aiHomepageFn = createServerFn({ method: "POST" })
  .inputValidator((d) => homeInput.parse(d))
  .handler(async ({ data }) => {
    const { isEnabled } = await import("@/server/services/ai-settings.service");
    if (!isEnabled("homepage")) return { ok: true as const, sections: [] };
    try {
      const { buildHomeSections } = await import("@/server/services/ai-homepage.service");
      const sections = buildHomeSections(data);
      return { ok: true as const, sections };
    } catch (e) {
      return { ok: false as const, error: friendly(e), sections: [] };
    }
  });

// ---------- Admin: settings + logs ----------

async function requireAdmin(): Promise<void> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  const me = await authService.me(token);
  if (!me || !me.isSuperAdmin) throw new Response("Forbidden", { status: 403 });
}

export const getAiSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getAiSettings } = await import("@/server/services/ai-settings.service");
  return getAiSettings();
});

const settingsInput = z.object({
  enabled: z.record(z.string(), z.boolean()).optional(),
  prompts: z.record(z.string(), z.string().max(2000)).optional(),
  featuredFestivals: z.array(z.string().max(60)).max(20).optional(),
});

export const updateAiSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((d) => settingsInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateAiSettings } = await import("@/server/services/ai-settings.service");
    return updateAiSettings(data as never);
  });

export const listAiLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { listAiLogs } = await import("@/server/services/ai-log.service");
  return listAiLogs(100);
});

// ---------- Helpers ----------

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("AI_UNCONFIGURED")) return "AI is not configured yet.";
  if (msg.includes("RATE_LIMITED")) return "Too many AI requests. Please wait a minute.";
  if (msg.includes("CREDITS_EXHAUSTED")) return "AI credits exhausted. Please try later.";
  if (msg.includes("AI_BAD_JSON")) return "AI returned an unexpected response. Please try again.";
  if (msg.includes("AI_UNAVAILABLE")) return "AI service is temporarily unavailable.";
  return "Sorry, something went wrong. Please try again.";
}
