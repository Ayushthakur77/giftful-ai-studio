/**
 * Phase 5 price engine.
 *
 * The single source of truth for line + cart totals. Runs isomorphically
 * (pure functions) so the same code protects both the client UI (for
 * responsive display) and the server (`compute-cart-totals`) that
 * authorises any checkout in Phase 6.
 *
 * Money is in **paise** (integer). Never convert to floats internally.
 */

import {
  findProductBySlug,
  findEmptyBoxBySlug,
  findReadyBoxBySlug,
  findAddOn,
  ribbons,
  fillers,
  greetingCards,
  type Product,
  type PersonalizationField,
} from "./catalog";

// ---------- Cart line types ----------

export type ProductLine = {
  kind: "product";
  id: string;
  productSlug: string;
  quantity: number;
  /** { fieldKey: value } — validated per product's personalization schema */
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

// ---------- Line pricing ----------

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

function priceProductLine(line: ProductLine): PricedLine {
  const p = findProductBySlug(line.productSlug);
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
    id: line.id,
    kind: "product",
    name: p.name,
    image: p.image,
    quantity: qty,
    unitPricePaise: p.pricePaise,
    personalizationPaise,
    addOnPaise: 0,
    lineSubtotalPaise: unit * qty,
    details: describePersonalization(p, line.personalization),
    errors: errors.length ? errors : undefined,
  };
}

function priceReadyBoxLine(line: ReadyBoxLine): PricedLine {
  const box = findReadyBoxBySlug(line.boxSlug);
  if (!box) {
    return {
      id: line.id, kind: "ready-box", name: "Unavailable box", image: "",
      quantity: line.quantity, unitPricePaise: 0, personalizationPaise: 0,
      addOnPaise: 0, lineSubtotalPaise: 0, errors: ["Gift box no longer available"],
    };
  }
  const qty = Math.max(1, line.quantity);
  return {
    id: line.id,
    kind: "ready-box",
    name: box.name,
    image: box.image,
    quantity: qty,
    unitPricePaise: box.pricePaise,
    personalizationPaise: 0,
    addOnPaise: 0,
    lineSubtotalPaise: box.pricePaise * qty,
    details: box.contents.map((c) => {
      const p = findProductBySlug(c.productSlug);
      return `${c.quantity}× ${p?.name ?? c.productSlug}`;
    }),
  };
}

function priceCustomBoxLine(line: CustomBoxLine): PricedLine {
  const box = findEmptyBoxBySlug(line.emptyBoxSlug);
  const errors: string[] = [];
  if (!box) {
    return {
      id: line.id, kind: "custom-box", name: "Unavailable box", image: "",
      quantity: line.quantity, unitPricePaise: 0, personalizationPaise: 0,
      addOnPaise: 0, lineSubtotalPaise: 0, errors: ["Gift box no longer available"],
    };
  }
  // Gift builder validation
  const totalSlots = line.items.reduce((s, it) => s + it.quantity, 0);
  if (totalSlots > box.capacity) errors.push(`Box holds ${box.capacity} items (you added ${totalSlots})`);
  let totalWeight = 0;
  let productsPaise = 0;
  let personalizationPaise = 0;
  const details: string[] = [];
  for (const it of line.items) {
    const p = findProductBySlug(it.productSlug);
    if (!p) { errors.push(`Missing product: ${it.productSlug}`); continue; }
    if (p.stock <= 0) errors.push(`${p.name}: out of stock`);
    if (box.allowedCategories.length && !box.allowedCategories.includes(p.category)) {
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
    id: line.id,
    kind: "custom-box",
    name: box.name,
    image: box.image,
    quantity: qty,
    unitPricePaise: box.pricePaise + productsPaise,
    personalizationPaise,
    addOnPaise,
    lineSubtotalPaise: unit * qty,
    details,
    errors: errors.length ? errors : undefined,
  };
}

export function priceLine(line: CartLine): PricedLine {
  switch (line.kind) {
    case "product":    return priceProductLine(line);
    case "ready-box":  return priceReadyBoxLine(line);
    case "custom-box": return priceCustomBoxLine(line);
  }
}

// ---------- Personalization ----------

function personalizationCost(
  product: Product,
  values: Record<string, string> | undefined,
  errors: string[],
): number {
  if (!values) return 0;
  if (!product.isPersonalizable) return 0;
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
  if (f.key === "font" || f.key === "color") {
    if (!f.options.includes(value)) {
      errors.push(`${f.label}: invalid choice`);
      return 0;
    }
    return f.extraPaise;
  }
  return 0;
}

function describePersonalization(p: Product, values?: Record<string, string>): string[] | undefined {
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

export const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999
export const FLAT_SHIPPING_PAISE = 9900;            // ₹99
export const TAX_PCT = 18; // GST 18% (Phase 8; admin-configurable later)

export function computeCart(lines: CartLine[]): CartTotals {
  const priced = lines.map(priceLine);
  const subtotal = priced.reduce((s, l) => s + l.lineSubtotalPaise, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_PAISE;
  const tax = Math.round((subtotal * TAX_PCT) / 100);
  const errors = priced.flatMap((l) => l.errors ?? []);
  return {
    lines: priced,
    subtotalPaise: subtotal,
    discountPaise: 0,
    shippingPaise: shipping,
    taxPaise: tax,
    grandTotalPaise: subtotal + shipping + tax,
    errors,
    free_shipping_threshold_paise: FREE_SHIPPING_THRESHOLD_PAISE,
  };
}
