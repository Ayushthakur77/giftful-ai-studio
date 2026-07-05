/**
 * Phase 5 catalog seed.
 *
 * This module is the SINGLE SOURCE OF TRUTH for products, categories,
 * occasions, recipients, empty gift boxes, ready-made gift boxes,
 * ribbons, fillers and greeting cards during Phase 5.
 *
 * When Phase 4b DB tables are wired to Neon, the helper functions here
 * are the seam to swap for Drizzle queries: keep the same signatures
 * (findProductBySlug, listProducts, etc.) and only the implementation
 * changes. All Phase 5 routes / server functions import from this file
 * exclusively — nothing reads the seed arrays directly.
 *
 * Money is stored in **paise** (integer minor units).
 */

import productFlowers from "@/assets/product-flowers.jpg";
import productFrame from "@/assets/product-frame.jpg";
import productCake from "@/assets/product-cake.jpg";
import productDryfruit from "@/assets/product-dryfruit.jpg";
import boxBuilderImg from "@/assets/box-builder.jpg";
import heroImg from "@/assets/hero-giftbox.jpg";

export const heroImage = heroImg;
export const boxBuilderImage = boxBuilderImg;

// ---------- Types ----------

export type CategorySlug =
  | "personalized"
  | "flowers"
  | "cakes"
  | "chocolates"
  | "hampers"
  | "corporate";

export type OccasionSlug =
  | "birthday"
  | "anniversary"
  | "wedding"
  | "rakhi"
  | "diwali"
  | "corporate";

export type RecipientSlug =
  | "him"
  | "her"
  | "kids"
  | "parents"
  | "couple"
  | "colleagues";

export type PersonalizationField =
  | { key: "name"; label: string; maxLength: number; extraPaise: number }
  | { key: "message"; label: string; maxLength: number; extraPaise: number }
  | { key: "font"; label: string; options: string[]; extraPaise: number }
  | { key: "color"; label: string; options: string[]; extraPaise: number }
  | { key: "image"; label: string; maxKb: number; extraPaise: number };

export type Product = {
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  category: CategorySlug;
  occasions: OccasionSlug[];
  recipients: RecipientSlug[];
  tags: string[];
  pricePaise: number;
  mrpPaise?: number;
  weightGrams: number;
  stock: number;
  rating: number; // 0-5
  ratingCount: number;
  badge?: string;
  isPersonalizable: boolean;
  isGiftBoxCompatible: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  personalization?: PersonalizationField[];
  specs?: { label: string; value: string }[];
};

export type Category = {
  slug: CategorySlug;
  name: string;
  description: string;
  displayOrder: number;
};

export type Occasion = {
  slug: OccasionSlug;
  name: string;
  emoji: string;
};

export type Recipient = { slug: RecipientSlug; name: string };

export type EmptyGiftBox = {
  slug: string;
  name: string;
  description: string;
  image: string;
  pricePaise: number;
  capacity: number; // max product slots
  maxWeightGrams: number;
  allowedCategories: CategorySlug[]; // empty = all
};

export type ReadyMadeGiftBox = {
  slug: string;
  name: string;
  description: string;
  image: string;
  pricePaise: number;
  mrpPaise?: number;
  contents: { productSlug: string; quantity: number }[];
  isCustomizable: boolean;
};

export type AddOn = {
  slug: string;
  name: string;
  image?: string;
  pricePaise: number;
};

// ---------- Seed data ----------

export const categories: Category[] = [
  { slug: "personalized", name: "Personalized", description: "Engraved & custom gifts", displayOrder: 1 },
  { slug: "flowers", name: "Flowers", description: "Fresh bouquets & arrangements", displayOrder: 2 },
  { slug: "cakes", name: "Cakes", description: "Fresh cakes, same-day delivery", displayOrder: 3 },
  { slug: "chocolates", name: "Chocolates", description: "Premium chocolate gifts", displayOrder: 4 },
  { slug: "hampers", name: "Hampers", description: "Curated luxury hampers", displayOrder: 5 },
  { slug: "corporate", name: "Corporate", description: "Bulk & corporate gifting", displayOrder: 6 },
];

export const occasions: Occasion[] = [
  { slug: "birthday", name: "Birthday", emoji: "🎂" },
  { slug: "anniversary", name: "Anniversary", emoji: "💍" },
  { slug: "wedding", name: "Wedding", emoji: "💐" },
  { slug: "rakhi", name: "Rakhi", emoji: "🪢" },
  { slug: "diwali", name: "Diwali", emoji: "🪔" },
  { slug: "corporate", name: "Corporate", emoji: "🏢" },
];

export const recipients: Recipient[] = [
  { slug: "him", name: "For Him" },
  { slug: "her", name: "For Her" },
  { slug: "kids", name: "For Kids" },
  { slug: "parents", name: "For Parents" },
  { slug: "couple", name: "For Couple" },
  { slug: "colleagues", name: "Colleagues" },
];

const namePersonalization: PersonalizationField[] = [
  { key: "name", label: "Recipient name", maxLength: 24, extraPaise: 9900 },
  { key: "message", label: "Custom message", maxLength: 140, extraPaise: 4900 },
  { key: "font", label: "Font", options: ["Classic Serif", "Modern Sans", "Handwritten"], extraPaise: 0 },
  { key: "color", label: "Engraving colour", options: ["Gold", "Silver", "Rose Gold"], extraPaise: 0 },
];

// Demo seed removed — products, empty gift boxes and ready-made gift boxes
// are now sourced from the admin-managed database. These arrays stay exported
// (empty) so legacy consumers keep compiling until they migrate to DB reads.
export const products: Product[] = [];

export const emptyGiftBoxes: EmptyGiftBox[] = [];

export const readyMadeGiftBoxes: ReadyMadeGiftBox[] = [];

export const ribbons: AddOn[] = [
  { slug: "no-ribbon", name: "No ribbon", pricePaise: 0 },
  { slug: "gold-satin", name: "Gold satin", pricePaise: 4900 },
  { slug: "red-velvet-ribbon", name: "Red velvet", pricePaise: 4900 },
  { slug: "black-grosgrain", name: "Black grosgrain", pricePaise: 5900 },
];

export const fillers: AddOn[] = [
  { slug: "no-filler", name: "No filler", pricePaise: 0 },
  { slug: "kraft-shred", name: "Kraft shred", pricePaise: 2900 },
  { slug: "rose-petals", name: "Dried rose petals", pricePaise: 6900 },
  { slug: "cotton-fluff", name: "Cotton fluff", pricePaise: 3900 },
];

export const greetingCards: AddOn[] = [
  { slug: "no-card", name: "No card", pricePaise: 0 },
  { slug: "classic-card", name: "Classic gold-foil card", pricePaise: 4900 },
  { slug: "handmade-card", name: "Handmade paper card", pricePaise: 7900 },
];

// ---------- Helpers ----------

export function findProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function findCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function findOccasionBySlug(slug: string): Occasion | undefined {
  return occasions.find((o) => o.slug === slug);
}

export function findEmptyBoxBySlug(slug: string): EmptyGiftBox | undefined {
  return emptyGiftBoxes.find((b) => b.slug === slug);
}

export function findReadyBoxBySlug(slug: string): ReadyMadeGiftBox | undefined {
  return readyMadeGiftBoxes.find((b) => b.slug === slug);
}

export function findAddOn(list: AddOn[], slug: string | undefined): AddOn | undefined {
  if (!slug) return undefined;
  return list.find((a) => a.slug === slug);
}

export type ListFilters = {
  category?: CategorySlug;
  occasion?: OccasionSlug;
  recipient?: RecipientSlug;
  q?: string;
  minPrice?: number; // paise
  maxPrice?: number; // paise
  minRating?: number;
  discountOnly?: boolean;
  personalizableOnly?: boolean;
  giftBoxCompatibleOnly?: boolean;
  inStockOnly?: boolean;
};

export type SortKey =
  | "popularity"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export function listProducts(
  filters: ListFilters = {},
  sort: SortKey = "popularity",
): Product[] {
  const q = filters.q?.trim().toLowerCase();
  let out = products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.occasion && !p.occasions.includes(filters.occasion)) return false;
    if (filters.recipient && !p.recipients.includes(filters.recipient)) return false;
    if (filters.minPrice != null && p.pricePaise < filters.minPrice) return false;
    if (filters.maxPrice != null && p.pricePaise > filters.maxPrice) return false;
    if (filters.minRating != null && p.rating < filters.minRating) return false;
    if (filters.inStockOnly && p.stock <= 0) return false;
    if (filters.personalizableOnly && !p.isPersonalizable) return false;
    if (filters.giftBoxCompatibleOnly && !p.isGiftBoxCompatible) return false;
    if (filters.discountOnly && !(p.mrpPaise && p.mrpPaise > p.pricePaise)) return false;
    if (q) {
      const hay = `${p.name} ${p.shortDescription} ${p.description} ${p.category} ${p.tags.join(" ")} ${p.occasions.join(" ")} ${p.recipients.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  switch (sort) {
    case "price-asc":
      out.sort((a, b) => a.pricePaise - b.pricePaise);
      break;
    case "price-desc":
      out.sort((a, b) => b.pricePaise - a.pricePaise);
      break;
    case "rating":
      out.sort((a, b) => b.rating - a.rating);
      break;
    case "discount":
      out.sort((a, b) => discountPct(b) - discountPct(a));
      break;
    case "newest":
      out = [...out].reverse();
      break;
    default:
      out.sort((a, b) => b.ratingCount - a.ratingCount);
  }
  return out;
}

export function discountPct(p: Product): number {
  if (!p.mrpPaise || p.mrpPaise <= p.pricePaise) return 0;
  return Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100);
}

export function relatedProducts(slug: string, count = 8): Product[] {
  const p = findProductBySlug(slug);
  if (!p) return [];
  return products
    .filter((x) => x.slug !== slug)
    .map((x) => ({
      x,
      score:
        (x.category === p.category ? 3 : 0) +
        x.occasions.filter((o) => p.occasions.includes(o)).length +
        x.recipients.filter((r) => p.recipients.includes(r)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ x }) => x);
}

export function searchSuggest(q: string, limit = 6): { slug: string; name: string; image: string }[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  return listProducts({ q: query }).slice(0, limit).map((p) => ({ slug: p.slug, name: p.name, image: p.image }));
}

export const popularSearches = [
  "Anniversary gifts",
  "Personalized frame",
  "Midnight cake",
  "Diwali hamper",
  "Roses",
  "For parents",
];

export function formatINR(paise: number): string {
  const rupees = Math.round(paise) / 100;
  // Show fractional rupees when the amount is less than ₹1 or has non-zero paise
  // so a ₹0.50 price never rounds up to a misleading "₹1".
  const hasFraction = rupees > 0 && rupees < 1000 && rupees !== Math.floor(rupees);
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`;
}

