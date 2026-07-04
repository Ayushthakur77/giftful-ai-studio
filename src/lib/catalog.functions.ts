/**
 * Server functions for Phase 5 shopping engine.
 *
 * These wrap the isomorphic catalog + pricing helpers behind an RPC
 * boundary so client callers cannot forge prices or bypass validation.
 * When Phase 4b DB tables replace the in-module seed, only the handler
 * bodies change — the schemas and shapes returned here are stable.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  searchSuggest as suggest,
  popularSearches as popular,
  findProductBySlug,
} from "./catalog";
import { computeCart, type CartLine } from "./pricing";

// ---------- Search ----------

export const searchSuggestFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ q: z.string().max(120) }).parse(raw),
  )
  .handler(({ data }) => ({
    results: suggest(data.q, 6),
    popular: popular.slice(0, 6),
  }));

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
  .handler(({ data }) => computeCart(data.lines as CartLine[]));

// ---------- Delivery estimate stub (Phase 5) ----------

export const checkPincodeFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ pincode: z.string().regex(/^\d{6}$/, "6-digit pincode required") }).parse(raw),
  )
  .handler(({ data }) => {
    // Placeholder logic — Phase 6 will call a real shipping engine.
    const prefix = parseInt(data.pincode.slice(0, 3), 10);
    const sameDay = prefix % 2 === 0; // deterministic demo
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
  .handler(({ data }) => {
    const p = findProductBySlug(data.slug);
    if (!p) return { ok: false, reason: "not_found" as const };
    if (p.stock <= 0) return { ok: false, reason: "out_of_stock" as const };
    return { ok: true, pricePaise: p.pricePaise, stock: p.stock };
  });
