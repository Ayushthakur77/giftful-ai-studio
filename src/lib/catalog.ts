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

export const products: Product[] = [
  {
    slug: "blush-bloom-bouquet",
    sku: "FLW-001",
    name: "Blush & Bloom Bouquet",
    shortDescription: "12 pink & white roses, hand-tied",
    description: "A romantic bouquet of a dozen pink and white roses, hand-tied with satin ribbon. Delivered fresh.",
    image: productFlowers,
    gallery: [productFlowers, productFlowers, productFlowers],
    category: "flowers",
    occasions: ["anniversary", "birthday", "wedding"],
    recipients: ["her", "couple"],
    tags: ["roses", "same-day", "romantic"],
    pricePaise: 149900,
    mrpPaise: 189900,
    weightGrams: 800,
    stock: 25,
    rating: 4.5,
    ratingCount: 1240,
    badge: "Same Day",
    isPersonalizable: false,
    isGiftBoxCompatible: false,
    isFeatured: true,
    isTrending: true,
    specs: [
      { label: "Flowers", value: "12 roses" },
      { label: "Colours", value: "Pink & white" },
      { label: "Freshness", value: "Delivered same day" },
    ],
  },
  {
    slug: "eternal-frame-keepsake",
    sku: "PRS-101",
    name: "Eternal Frame Keepsake",
    shortDescription: "Personalized wooden photo frame",
    description: "Solid oak frame with laser-engraved names and date. A keepsake for anniversaries and weddings.",
    image: productFrame,
    gallery: [productFrame, productFrame],
    category: "personalized",
    occasions: ["anniversary", "wedding", "birthday"],
    recipients: ["couple", "her", "him", "parents"],
    tags: ["engraved", "wood", "photo"],
    pricePaise: 89900,
    mrpPaise: 129900,
    weightGrams: 350,
    stock: 60,
    rating: 4.6,
    ratingCount: 812,
    badge: "Personalized",
    isPersonalizable: true,
    isGiftBoxCompatible: true,
    isFeatured: true,
    isBestSeller: true,
    personalization: namePersonalization,
    specs: [
      { label: "Material", value: "Solid oak" },
      { label: "Size", value: "8x10 inches" },
      { label: "Engraving", value: "Laser" },
    ],
  },
  {
    slug: "midnight-belgian-truffle",
    sku: "CAK-201",
    name: "Midnight Belgian Truffle Cake",
    shortDescription: "Rich Belgian chocolate truffle, 500g",
    description: "Dense Belgian chocolate ganache layered with dark truffle cream. Available for midnight delivery.",
    image: productCake,
    gallery: [productCake, productCake],
    category: "cakes",
    occasions: ["birthday", "anniversary"],
    recipients: ["her", "him", "couple", "kids"],
    tags: ["chocolate", "midnight", "eggless-option"],
    pricePaise: 119900,
    mrpPaise: 149900,
    weightGrams: 500,
    stock: 40,
    rating: 4.7,
    ratingCount: 2130,
    badge: "Midnight",
    isPersonalizable: true,
    isGiftBoxCompatible: false,
    isTrending: true,
    personalization: [
      { key: "name", label: "Name on cake", maxLength: 20, extraPaise: 0 },
      { key: "message", label: "Cake topper text", maxLength: 40, extraPaise: 4900 },
    ],
    specs: [
      { label: "Weight", value: "500g" },
      { label: "Type", value: "Belgian truffle" },
      { label: "Eggless", value: "Available on request" },
    ],
  },
  {
    slug: "imperial-dry-fruit-casket",
    sku: "HMP-301",
    name: "Imperial Dry Fruit Casket",
    shortDescription: "Premium dry fruit hamper in wooden casket",
    description: "Almonds, cashews, walnuts, pistachios and Medjool dates in a hand-crafted wooden casket.",
    image: productDryfruit,
    gallery: [productDryfruit],
    category: "hampers",
    occasions: ["diwali", "corporate", "wedding"],
    recipients: ["parents", "colleagues", "couple"],
    tags: ["premium", "festival", "corporate"],
    pricePaise: 249900,
    mrpPaise: 299900,
    weightGrams: 1400,
    stock: 15,
    rating: 4.4,
    ratingCount: 645,
    badge: "Festival",
    isPersonalizable: false,
    isGiftBoxCompatible: false,
    isFeatured: true,
    specs: [
      { label: "Contents", value: "5 varieties" },
      { label: "Weight", value: "1.4 kg" },
      { label: "Packaging", value: "Wooden casket" },
    ],
  },
  {
    slug: "sunshine-roses-vase",
    sku: "FLW-002",
    name: "Sunshine Roses in Glass Vase",
    shortDescription: "20 yellow roses in a glass vase",
    description: "A cheerful arrangement of 20 yellow roses in a heavy glass vase. Ideal for birthdays.",
    image: productFlowers,
    gallery: [productFlowers],
    category: "flowers",
    occasions: ["birthday", "anniversary"],
    recipients: ["her", "parents"],
    tags: ["yellow", "vase"],
    pricePaise: 179900,
    mrpPaise: 219900,
    weightGrams: 1200,
    stock: 12,
    rating: 4.3,
    ratingCount: 380,
    isPersonalizable: false,
    isGiftBoxCompatible: false,
    specs: [{ label: "Flowers", value: "20 roses" }, { label: "Vase", value: "Glass" }],
  },
  {
    slug: "engraved-couple-frame",
    sku: "PRS-102",
    name: "Engraved Couple Frame",
    shortDescription: "Personalized couple photo frame",
    description: "Walnut wood frame engraved with the couple's names and anniversary date.",
    image: productFrame,
    gallery: [productFrame],
    category: "personalized",
    occasions: ["anniversary", "wedding"],
    recipients: ["couple"],
    tags: ["engraved", "wood", "romantic"],
    pricePaise: 109900,
    weightGrams: 450,
    stock: 40,
    rating: 4.8,
    ratingCount: 512,
    badge: "Personalized",
    isPersonalizable: true,
    isGiftBoxCompatible: true,
    isBestSeller: true,
    personalization: namePersonalization,
    specs: [{ label: "Material", value: "Walnut" }, { label: "Size", value: "10x12 inches" }],
  },
  {
    slug: "red-velvet-heart-cake",
    sku: "CAK-202",
    name: "Red Velvet Heart Cake",
    shortDescription: "Heart-shaped red velvet cake, 500g",
    description: "Classic red velvet with cream-cheese frosting, shaped as a heart. Perfect for anniversaries.",
    image: productCake,
    gallery: [productCake],
    category: "cakes",
    occasions: ["anniversary", "birthday"],
    recipients: ["her", "couple"],
    tags: ["red-velvet", "heart"],
    pricePaise: 89900,
    mrpPaise: 109900,
    weightGrams: 500,
    stock: 30,
    rating: 4.6,
    ratingCount: 1980,
    isPersonalizable: true,
    isGiftBoxCompatible: false,
    isTrending: true,
    personalization: [
      { key: "name", label: "Name on cake", maxLength: 20, extraPaise: 0 },
    ],
    specs: [{ label: "Weight", value: "500g" }, { label: "Shape", value: "Heart" }],
  },
  {
    slug: "royal-nut-chocolate-hamper",
    sku: "HMP-302",
    name: "Royal Nut & Chocolate Hamper",
    shortDescription: "Belgian chocolates & premium nuts",
    description: "Assorted Belgian chocolates, roasted almonds, cashews and gourmet pistachios in a gift tray.",
    image: productDryfruit,
    gallery: [productDryfruit],
    category: "hampers",
    occasions: ["diwali", "corporate", "birthday"],
    recipients: ["parents", "colleagues"],
    tags: ["hamper", "chocolate"],
    pricePaise: 189900,
    mrpPaise: 229900,
    weightGrams: 1100,
    stock: 22,
    rating: 4.5,
    ratingCount: 720,
    badge: "Hamper",
    isPersonalizable: false,
    isGiftBoxCompatible: false,
    isFeatured: true,
    specs: [{ label: "Contents", value: "Assorted" }, { label: "Weight", value: "1.1 kg" }],
  },
  {
    slug: "handwritten-scented-candle",
    sku: "PRS-103",
    name: "Handwritten Scented Candle",
    shortDescription: "Soy-wax candle with custom label",
    description: "Vanilla and sandalwood soy-wax candle in a frosted glass jar with a custom hand-written label.",
    image: productFrame,
    gallery: [productFrame],
    category: "personalized",
    occasions: ["birthday", "anniversary", "diwali"],
    recipients: ["her", "couple", "colleagues"],
    tags: ["candle", "aromatherapy"],
    pricePaise: 79900,
    mrpPaise: 99900,
    weightGrams: 300,
    stock: 80,
    rating: 4.4,
    ratingCount: 210,
    isPersonalizable: true,
    isGiftBoxCompatible: true,
    personalization: [
      { key: "name", label: "Name on label", maxLength: 20, extraPaise: 0 },
      { key: "message", label: "Message on label", maxLength: 60, extraPaise: 2900 },
    ],
    specs: [{ label: "Scent", value: "Vanilla · Sandalwood" }, { label: "Burn time", value: "40 hrs" }],
  },
  {
    slug: "single-origin-chocolate-box",
    sku: "CHC-401",
    name: "Single-Origin Chocolate Box",
    shortDescription: "18-piece assortment",
    description: "A tasting box of 18 hand-crafted chocolates from Madagascar, Ecuador and Ghana.",
    image: productDryfruit,
    gallery: [productDryfruit],
    category: "chocolates",
    occasions: ["birthday", "anniversary", "corporate"],
    recipients: ["her", "him", "couple", "colleagues"],
    tags: ["chocolate", "premium"],
    pricePaise: 129900,
    mrpPaise: 159900,
    weightGrams: 320,
    stock: 55,
    rating: 4.7,
    ratingCount: 934,
    isPersonalizable: false,
    isGiftBoxCompatible: true,
    isBestSeller: true,
    specs: [{ label: "Pieces", value: "18" }, { label: "Type", value: "Single-origin dark" }],
  },
  {
    slug: "kids-treasure-hamper",
    sku: "HMP-303",
    name: "Kids' Treasure Hamper",
    shortDescription: "Toys, chocolates & story book",
    description: "A joy-filled hamper with a soft toy, milk chocolates, colouring set and a story book.",
    image: productDryfruit,
    gallery: [productDryfruit],
    category: "hampers",
    occasions: ["birthday"],
    recipients: ["kids"],
    tags: ["kids", "toys"],
    pricePaise: 149900,
    weightGrams: 900,
    stock: 18,
    rating: 4.5,
    ratingCount: 210,
    isPersonalizable: false,
    isGiftBoxCompatible: false,
    specs: [{ label: "Age", value: "3–10 yrs" }],
  },
  {
    slug: "corporate-diwali-hamper",
    sku: "COR-501",
    name: "Corporate Diwali Hamper",
    shortDescription: "Sweets, dry fruits & candle",
    description: "A tasteful corporate gift with kaju katli, mixed dry fruits and a handmade candle in a keepsake box.",
    image: productDryfruit,
    gallery: [productDryfruit],
    category: "corporate",
    occasions: ["diwali", "corporate"],
    recipients: ["colleagues", "parents"],
    tags: ["corporate", "festival"],
    pricePaise: 219900,
    mrpPaise: 259900,
    weightGrams: 1300,
    stock: 100,
    rating: 4.6,
    ratingCount: 402,
    badge: "Festival",
    isPersonalizable: false,
    isGiftBoxCompatible: false,
    isFeatured: true,
    specs: [{ label: "Bulk", value: "Available for 50+ units" }],
  },
];

export const emptyGiftBoxes: EmptyGiftBox[] = [
  {
    slug: "signature-black-3",
    name: "Signature Black Box · 3 slots",
    description: "Matte-black gift box with satin lining. Fits 3 small–medium products.",
    image: boxBuilderImg,
    pricePaise: 39900,
    capacity: 3,
    maxWeightGrams: 1500,
    allowedCategories: [],
  },
  {
    slug: "premium-oak-5",
    name: "Premium Oak Box · 5 slots",
    description: "Solid oak wooden box with hinged lid. Fits up to 5 products.",
    image: boxBuilderImg,
    pricePaise: 79900,
    capacity: 5,
    maxWeightGrams: 3500,
    allowedCategories: [],
  },
  {
    slug: "luxury-velvet-7",
    name: "Luxury Velvet Box · 7 slots",
    description: "Velvet-lined magnetic-close box. Fits 7 slots — great for hampers.",
    image: boxBuilderImg,
    pricePaise: 129900,
    capacity: 7,
    maxWeightGrams: 5500,
    allowedCategories: [],
  },
];

export const readyMadeGiftBoxes: ReadyMadeGiftBox[] = [
  {
    slug: "her-anniversary-box",
    name: "Anniversary Box for Her",
    description: "A curated box: personalized frame, scented candle and Belgian chocolates.",
    image: boxBuilderImg,
    pricePaise: 259900,
    mrpPaise: 319900,
    contents: [
      { productSlug: "eternal-frame-keepsake", quantity: 1 },
      { productSlug: "handwritten-scented-candle", quantity: 1 },
      { productSlug: "single-origin-chocolate-box", quantity: 1 },
    ],
    isCustomizable: true,
  },
  {
    slug: "diwali-family-box",
    name: "Diwali Family Box",
    description: "Dry-fruit casket, chocolate box and a scented candle in a keepsake tray.",
    image: boxBuilderImg,
    pricePaise: 449900,
    mrpPaise: 519900,
    contents: [
      { productSlug: "imperial-dry-fruit-casket", quantity: 1 },
      { productSlug: "single-origin-chocolate-box", quantity: 1 },
      { productSlug: "handwritten-scented-candle", quantity: 1 },
    ],
    isCustomizable: false,
  },
];

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
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
