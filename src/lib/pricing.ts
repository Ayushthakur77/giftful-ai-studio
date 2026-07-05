/**
 * Cart pricing engine (pure, synchronous).
 *
 * The engine is intentionally *pure*: it takes a `CatalogSnapshot`
 * (loaded from the DB by `catalog-repo.server.ts`) plus the cart lines,
 * and returns fully priced totals. Never imports the legacy static
 * `catalog.ts` module — pricing always reflects live DB data.
 *
 * Ribbons / fillers / greeting cards remain a small static add-on list
 * because they are cosmetic packaging options, not admin-managed
 * inventory. When admin management is added they can be swapped in the
 * same way products/boxes were.
 *
 * Money is in **paise** (integer). Never convert to floats internally.
 */

// ---------- Cart line types ----------

export type ProductLine = {
  kind: "product";
  id: string;
  productSlug: string;
  quantity: number;
  personalization?: Record<string, string>;
};

export type ReadyBoxLine = {
  kind: "ready-box";
  id: string;
  boxSlug: string;
  quantity: number;
};

export type CustomBoxLine = {
  kind: "custom-box";
  id: string;
  emptyBoxSlug: string;
  items: { productSlug: string; quantity: number; personalization?: Record<string, string> }[];
  ribbonSlug?: string;
  fillerSlug?: string;
  cardSlug?: string;
  giftNote?: string;
  quantity: number;
};

export type CartLine = ProductLine | ReadyBoxLine | CustomBoxLine;

// ---------- Catalog snapshot (loaded from DB) ----------

export type PersonalizationField =
  | { key: "name"; label: string; maxLength: number; extraPaise: number }
  | { key: "message"; label: string; maxLength: number; extraPaise: number }
  | { key: "font"; label: string; options: string[]; extraPaise: number }
  | { key: "color"; label: string; options: string[]; extraPaise: number };

export type PricingProduct = {
  slug: string;
  name: string;
  image: string;
  pricePaise: number;
  stock: number;
  weightGrams: number;
  isGiftBoxCompatible: boolean;
  isPersonalizable: boolean;
  personalization?: PersonalizationField[];
  categorySlug: string | null;
};

export type PricingReadyBox = {
  slug: string;
  name: string;
  image: string;
  pricePaise: number;
  stock: number;
  contents: { productSlug: string; quantity: number }[];
};

export type PricingEmptyBox = {
  slug: string;
  name: string;
  image: string;
  pricePaise: number;
  capacity: number;
  maxWeightGrams: number;
  allowedCategorySlugs: string[];
  available: boolean;
};

export type CatalogSnapshot = {
  products: Map<string, PricingProduct>;
  readyBoxes: Map<string, PricingReadyBox>;
  emptyBoxes: Map<string, PricingEmptyBox>;
};

export const EMPTY_SNAPSHOT: CatalogSnapshot = {
  products: new Map(),
  readyBoxes: new Map(),
  emptyBoxes: new Map(),
};

// ---------- Static add-ons (packaging, not inventory) ----------

export type AddOn = { slug: string; name: string; pricePaise: number };

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
function findAddOn(list: AddOn[], slug: string | undefined): AddOn | undefined {
  if (!slug) return undefined;
  return list.find((a) => a.slug === slug);
}

// ---------- Priced line output ----------

export type PricedLine = {
  id: string;
  kind: CartLine["kind"];
  name: string;
  image: string;
  quantity: number;
  unitPricePaise: number;
  personalizationPaise: number;
  addOnPaise: number;
  lineSubtotalPaise: number;
  details?: string[];
  errors?: string[];
};

function priceProductLine(line: ProductLine, snap: CatalogSnapshot): PricedLine {
  const p = snap.products.get(line.productSlug);
  const errors: string[] = [];
  if (!p) {
    return {
      id: line.id, kind: "product", name: "Unavailable product", image: "",
      quantity: line.quantity, unitPricePaise: 0, personalizationPaise: 0,
      addOnPaise: 0, lineSubtotalPaise: 0, errors: ["Product no longer available"],
    };
  }
  if (p.stock <= 0) errors.push("Out of stock");
  else if (line.quantity > p.stock) errors.push(`Only ${p.stock} left`);
  if (line.quantity < 1) errors.push("Quantity must be at least 1");

  const personalizationPaise = personalizationCost(p, line.personalization, errors);
  const qty = Math.max(1, line.quantity);
  const unit = p.pricePaise + personalizationPaise;
  return {
    id: line.id, kind: "product", name: p.name, image: p.image, quantity: qty,
    unitPricePaise: p.pricePaise, personalizationPaise, addOnPaise: 0,
    lineSubtotalPaise: unit * qty,
    details: describePersonalization(p, line.personalization),
    errors: errors.length ? errors : undefined,
  };
}

function priceReadyBoxLine(line: ReadyBoxLine, snap: CatalogSnapshot): PricedLine {
  const box = snap.readyBoxes.get(line.boxSlug);
  if (!box) {
    return {
      id: line.id, kind: "ready-box", name: "Unavailable box", image: "",
      quantity: line.quantity, unitPricePaise: 0, personalizationPaise: 0,
      addOnPaise: 0, lineSubtotalPaise: 0, errors: ["Gift box no longer available"],
    };
  }
  const errors: string[] = [];
  if (box.stock <= 0) errors.push("Out of stock");
  else if (line.quantity > box.stock) errors.push(`Only ${box.stock} left`);

  const qty = Math.max(1, line.quantity);
  return {
    id: line.id, kind: "ready-box", name: box.name, image: box.image, quantity: qty,
    unitPricePaise: box.pricePaise, personalizationPaise: 0, addOnPaise: 0,
    lineSubtotalPaise: box.pricePaise * qty,
    details: box.contents.map((c) => {
      const p = snap.products.get(c.productSlug);
      return `${c.quantity}× ${p?.name ?? c.productSlug}`;
    }),
    errors: errors.length ? errors : undefined,
  };
}

function priceCustomBoxLine(line: CustomBoxLine, snap: CatalogSnapshot): PricedLine {
  const box = snap.emptyBoxes.get(line.emptyBoxSlug);
  const errors: string[] = [];
  if (!box) {
    return {
      id: line.id, kind: "custom-box", name: "Unavailable box", image: "",
      quantity: line.quantity, unitPricePaise: 0, personalizationPaise: 0,
      addOnPaise: 0, lineSubtotalPaise: 0, errors: ["Gift box no longer available"],
    };
  }
  if (!box.available) errors.push("Gift box is currently unavailable");
  const totalSlots = line.items.reduce((s, it) => s + it.quantity, 0);
  if (totalSlots > box.capacity) errors.push(`Box holds ${box.capacity} items (you added ${totalSlots})`);
  let totalWeight = 0;
  let productsPaise = 0;
  let personalizationPaise = 0;
  const details: string[] = [];
  for (const it of line.items) {
    const p = snap.products.get(it.productSlug);
    if (!p) { errors.push(`Missing product: ${it.productSlug}`); continue; }
    if (p.stock <= 0) errors.push(`${p.name}: out of stock`);
    if (box.allowedCategorySlugs.length && p.categorySlug && !box.allowedCategorySlugs.includes(p.categorySlug)) {
      errors.push(`${p.name}: not allowed in this box`);
    }
    if (!p.isGiftBoxCompatible) errors.push(`${p.name}: not compatible with gift boxes`);
    totalWeight += p.weightGrams * it.quantity;
    productsPaise += p.pricePaise * it.quantity;
    const perItemPers = personalizationCost(p, it.personalization, errors);
    personalizationPaise += perItemPers * it.quantity;
    details.push(`${it.quantity}× ${p.name}`);
  }
  if (totalWeight > box.maxWeightGrams) {
    errors.push(`Contents too heavy (${totalWeight}g > ${box.maxWeightGrams}g)`);
  }
  const ribbon = findAddOn(ribbons, line.ribbonSlug);
  const filler = findAddOn(fillers, line.fillerSlug);
  const card = findAddOn(greetingCards, line.cardSlug);
  const addOnPaise = (ribbon?.pricePaise ?? 0) + (filler?.pricePaise ?? 0) + (card?.pricePaise ?? 0);
  if (ribbon && ribbon.slug !== "no-ribbon") details.push(`Ribbon: ${ribbon.name}`);
  if (filler && filler.slug !== "no-filler") details.push(`Filler: ${filler.name}`);
  if (card && card.slug !== "no-card") details.push(`Card: ${card.name}`);
  if (line.giftNote) details.push(`Note: “${line.giftNote.slice(0, 40)}${line.giftNote.length > 40 ? "…" : ""}”`);

  const qty = Math.max(1, line.quantity);
  const unit = box.pricePaise + productsPaise + personalizationPaise + addOnPaise;
  return {
    id: line.id, kind: "custom-box", name: box.name, image: box.image, quantity: qty,
    unitPricePaise: box.pricePaise + productsPaise,
    personalizationPaise, addOnPaise,
    lineSubtotalPaise: unit * qty,
    details, errors: errors.length ? errors : undefined,
  };
}

export function priceLine(line: CartLine, snap: CatalogSnapshot): PricedLine {
  switch (line.kind) {
    case "product":    return priceProductLine(line, snap);
    case "ready-box":  return priceReadyBoxLine(line, snap);
    case "custom-box": return priceCustomBoxLine(line, snap);
  }
}

// ---------- Personalization ----------

function personalizationCost(
  product: PricingProduct,
  values: Record<string, string> | undefined,
  errors: string[],
): number {
  if (!values || !product.isPersonalizable) return 0;
  const fields = product.personalization ?? [];
  let extra = 0;
  for (const f of fields) {
    const v = values[f.key];
    if (!v || v.trim().length === 0) continue;
    extra += validateField(f, v, errors);
  }
  return extra;
}

function validateField(f: PersonalizationField, value: string, errors: string[]): number {
  if (f.key === "name" || f.key === "message") {
    if (value.length > f.maxLength) {
      errors.push(`${f.label}: too long (max ${f.maxLength} characters)`);
      return 0;
    }
    return f.extraPaise;
  }
  if (!f.options.includes(value)) {
    errors.push(`${f.label}: invalid choice`);
    return 0;
  }
  return f.extraPaise;
}

function describePersonalization(p: PricingProduct, values?: Record<string, string>): string[] | undefined {
  if (!values || !p.personalization) return undefined;
  const out: string[] = [];
  for (const f of p.personalization) {
    const v = values[f.key];
    if (v) out.push(`${f.label}: ${v}`);
  }
  return out.length ? out : undefined;
}

// ---------- Cart totals ----------

export type CartTotals = {
  lines: PricedLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  errors: string[];
  free_shipping_threshold_paise: number;
};

export const FREE_SHIPPING_THRESHOLD_PAISE = 5000; // ₹50
export const FLAT_SHIPPING_PAISE = 7000;           // ₹70
export const TAX_PCT = 0;

export function computeCart(lines: CartLine[], snap: CatalogSnapshot = EMPTY_SNAPSHOT): CartTotals {
  const priced = lines.map((l) => priceLine(l, snap));
  const subtotal = priced.reduce((s, l) => s + l.lineSubtotalPaise, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_PAISE;
  const tax = Math.round((subtotal * TAX_PCT) / 100);
  const errors = priced.flatMap((l) => l.errors ?? []);
  return {
    lines: priced, subtotalPaise: subtotal, discountPaise: 0,
    shippingPaise: shipping, taxPaise: tax,
    grandTotalPaise: subtotal + shipping + tax,
    errors, free_shipping_threshold_paise: FREE_SHIPPING_THRESHOLD_PAISE,
  };
}
