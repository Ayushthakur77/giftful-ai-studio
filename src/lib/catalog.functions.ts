/**
 * Server functions for the shopping engine.
 *
 * All pricing is done here with a live DB catalog snapshot; the client
 * never sees or forges prices.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeCart, type CartLine } from "./pricing";
import { loadCatalogSnapshot } from "./catalog-repo.server";

// ---------- Search ----------

const popular = [
  "Anniversary gifts",
  "Personalized frame",
  "Midnight cake",
  "Diwali hamper",
  "Roses",
  "For parents",
];

export const searchSuggestFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ q: z.string().max(120) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim().toLowerCase();
    if (!q) return { results: [], popular: popular.slice(0, 6) };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("products")
      .select("slug,name,images")
      .eq("status", "active")
      .ilike("name", `%${q}%`)
      .limit(6);
    const results = (rows ?? []).map((r) => {
      const images = Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
      return { slug: r.slug, name: r.name, image: images[0] ?? "" };
    });
    return { results, popular: popular.slice(0, 6) };
  });

// ---------- Cart totals (server is source of truth) ----------

const personalizationSchema = z.record(z.string(), z.string().max(500)).optional();

const cartLineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("product"),
    id: z.string(),
    productSlug: z.string(),
    quantity: z.number().int().min(1).max(20),
    personalization: personalizationSchema,
  }),
  z.object({
    kind: z.literal("ready-box"),
    id: z.string(),
    boxSlug: z.string(),
    quantity: z.number().int().min(1).max(20),
  }),
  z.object({
    kind: z.literal("custom-box"),
    id: z.string(),
    emptyBoxSlug: z.string(),
    items: z.array(
      z.object({
        productSlug: z.string(),
        quantity: z.number().int().min(1).max(10),
        personalization: personalizationSchema,
      }),
    ).max(20),
    ribbonSlug: z.string().optional(),
    fillerSlug: z.string().optional(),
    cardSlug: z.string().optional(),
    giftNote: z.string().max(500).optional(),
    quantity: z.number().int().min(1).max(10),
  }),
]);

export const computeCartTotalsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ lines: z.array(cartLineSchema).max(50) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const lines = data.lines as CartLine[];
    const snap = await loadCatalogSnapshot(lines);
    return computeCart(lines, snap);
  });

// ---------- Delivery estimate stub ----------

export const checkPincodeFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ pincode: z.string().regex(/^\d{6}$/, "6-digit pincode required") }).parse(raw),
  )
  .handler(({ data }) => {
    const prefix = parseInt(data.pincode.slice(0, 3), 10);
    const sameDay = prefix % 2 === 0;
    return {
      pincode: data.pincode,
      serviceable: true,
      sameDay,
      estimate: sameDay ? "Delivery today" : "Delivery in 2–3 days",
      codAvailable: !sameDay,
    };
  });

// ---------- Product validity (used by "Buy Now" server-side checks) ----------

export const validateProductFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ slug: z.string() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("products")
      .select("price_paise,offer_price_paise,stock,status")
      .eq("slug", data.slug).maybeSingle();
    if (!p || p.status !== "active") return { ok: false as const, reason: "not_found" as const };
    if ((p.stock ?? 0) <= 0) return { ok: false as const, reason: "out_of_stock" as const };
    return { ok: true as const, pricePaise: p.offer_price_paise ?? p.price_paise, stock: p.stock };
  });
