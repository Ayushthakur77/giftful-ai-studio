/**
 * Phase 5 client cart + wishlist stores.
 *
 * Persisted to localStorage under `giftty.cart.v1` / `giftty.wishlist.v1`.
 * When Phase 6 wires an authenticated cart to Neon, the login handler
 * should merge these local lines into the server cart, then clear.
 *
 * All money comes from the server via `pricing.ts` (isomorphic pure
 * functions) — the store only holds structural data, never precomputed
 * totals. Totals are derived on read.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, ProductLine, ReadyBoxLine, CustomBoxLine } from "./pricing";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Cart ----------

type CartState = {
  lines: CartLine[];
  hydrated: boolean;
  addProduct: (productSlug: string, quantity?: number, personalization?: Record<string, string>) => void;
  addReadyBox: (boxSlug: string, quantity?: number) => void;
  addCustomBox: (line: Omit<CustomBoxLine, "id" | "kind" | "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,
      addProduct: (productSlug, quantity = 1, personalization) =>
        set((s) => {
          // Merge only when no personalization on either side
          if (!personalization) {
            const existing = s.lines.find(
              (l): l is ProductLine =>
                l.kind === "product" && l.productSlug === productSlug && !l.personalization,
            );
            if (existing) {
              return { lines: s.lines.map((l) =>
                l.id === existing.id ? { ...l, quantity: l.quantity + quantity } : l) };
            }
          }
          const line: ProductLine = { kind: "product", id: uid(), productSlug, quantity, personalization };
          return { lines: [...s.lines, line] };
        }),
      addReadyBox: (boxSlug, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find(
            (l): l is ReadyBoxLine => l.kind === "ready-box" && l.boxSlug === boxSlug,
          );
          if (existing) {
            return { lines: s.lines.map((l) =>
              l.id === existing.id ? { ...l, quantity: l.quantity + quantity } : l) };
          }
          return { lines: [...s.lines, { kind: "ready-box", id: uid(), boxSlug, quantity }] };
        }),
      addCustomBox: (line) =>
        set((s) => ({ lines: [...s.lines, { ...line, kind: "custom-box", id: uid(), quantity: 1 }] })),
      updateQuantity: (id, quantity) =>
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, quantity) } : l)) })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "giftty.cart.v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

// ---------- Wishlist ----------

type WishlistState = {
  slugs: string[];
  hydrated: boolean;
  toggle: (slug: string) => void;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      hydrated: false,
      toggle: (slug) =>
        set((s) => ({ slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [...s.slugs, slug] })),
      add: (slug) => set((s) => (s.slugs.includes(slug) ? s : { slugs: [...s.slugs, slug] })),
      remove: (slug) => set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),
      has: (slug) => get().slugs.includes(slug),
      clear: () => set({ slugs: [] }),
    }),
    {
      name: "giftty.wishlist.v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

// ---------- Recently viewed ----------

const RV_KEY = "giftty.recently-viewed.v1";
const RV_MAX = 12;

export function pushRecentlyViewed(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RV_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = [slug, ...arr.filter((s) => s !== slug)].slice(0, RV_MAX);
    window.localStorage.setItem(RV_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

const RS_KEY = "giftty.recent-searches.v1";
const RS_MAX = 8;

export function pushRecentSearch(q: string) {
  if (typeof window === "undefined") return;
  const query = q.trim();
  if (!query) return;
  try {
    const raw = window.localStorage.getItem(RS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = [query, ...arr.filter((s) => s.toLowerCase() !== query.toLowerCase())].slice(0, RS_MAX);
    window.localStorage.setItem(RS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
