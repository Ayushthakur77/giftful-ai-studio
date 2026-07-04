/**
 * AI Gift Assistant + Gift Box Builder recommendation services.
 *
 * Model output is treated as untrusted: every returned slug is validated
 * against the live catalog for stock, price and (for boxes) capacity /
 * weight / category rules before the response reaches the client.
 */
import { aiChatJSON } from "./ai-gateway.service";
import {
  safeProductCatalog,
  safeBoxCatalog,
  safeReadyBoxes,
  safeAddOns,
} from "./ai-context.service";
import { getPrompt } from "./ai-settings.service";
import {
  findProductBySlug,
  findEmptyBoxBySlug,
  findReadyBoxBySlug,
  products as allProducts,
  ribbons,
  fillers,
  greetingCards,
  type Product,
  type EmptyGiftBox,
} from "@/lib/catalog";

// ------------------------------------------------------------------
// Gift Assistant
// ------------------------------------------------------------------

export type RecommendInput = {
  query: string;
  occasion?: string;
  relationship?: string;
  budgetPaise?: number;
  tone?: string;
  userId?: string;
};

export type RecommendedProduct = { slug: string; reason: string };
export type RecommendedBox = { slug: string; reason: string };

export type RecommendResult = {
  intent: {
    occasion?: string;
    relationship?: string;
    budgetPaise?: number;
    tags: string[];
  };
  products: RecommendedProduct[];
  readyBoxes: RecommendedBox[];
  buildBoxSuggested: boolean;
  note: string;
};

type RawRecommend = {
  intent?: { occasion?: string; relationship?: string; budgetPaise?: number; tags?: string[] };
  products?: { slug: string; reason?: string }[];
  readyBoxes?: { slug: string; reason?: string }[];
  buildBoxSuggested?: boolean;
  note?: string;
};

export async function recommendGifts(input: RecommendInput): Promise<RecommendResult> {
  const catalog = safeProductCatalog();
  const boxes = safeReadyBoxes();

  const system = getPrompt("assistant");
  const user = [
    `Customer message: "${input.query}"`,
    input.occasion ? `Occasion: ${input.occasion}` : null,
    input.relationship ? `Relationship: ${input.relationship}` : null,
    input.budgetPaise ? `Budget: ₹${(input.budgetPaise / 100).toFixed(0)} (${input.budgetPaise} paise)` : null,
    input.tone ? `Preferred tone: ${input.tone}` : null,
    "",
    "Available products (JSON):",
    JSON.stringify(catalog),
    "",
    "Available ready-made gift boxes (JSON):",
    JSON.stringify(boxes),
    "",
    "Return a strict JSON object with this shape (no markdown, no commentary):",
    `{
  "intent": { "occasion": string|null, "relationship": string|null, "budgetPaise": number|null, "tags": string[] },
  "products": [{ "slug": string, "reason": string (max 90 chars) }],  // up to 6
  "readyBoxes": [{ "slug": string, "reason": string }],                // up to 3
  "buildBoxSuggested": boolean,
  "note": string  // a warm 1-2 sentence gift note draft
}`,
    "Rules: choose ONLY slugs from the catalog above. Respect the budget when set. Prefer variety across categories. If nothing fits, return empty arrays.",
  ].filter(Boolean).join("\n");

  const raw = await aiChatJSON<RawRecommend>({
    feature: "assistant",
    userId: input.userId,
    temperature: 0.6,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  // Validate every slug against the live catalog.
  const products = (raw.products ?? [])
    .map((r) => ({ product: findProductBySlug(r.slug), reason: r.reason ?? "" }))
    .filter((r): r is { product: Product; reason: string } => !!r.product && r.product.stock > 0)
    .filter((r) => !input.budgetPaise || r.product.pricePaise <= input.budgetPaise * 1.15)
    .slice(0, 6)
    .map((r) => ({ slug: r.product.slug, reason: r.reason.slice(0, 140) }));

  const readyBoxes = (raw.readyBoxes ?? [])
    .map((r) => ({ box: findReadyBoxBySlug(r.slug), reason: r.reason ?? "" }))
    .filter((r): r is { box: NonNullable<ReturnType<typeof findReadyBoxBySlug>>; reason: string } => !!r.box)
    .slice(0, 3)
    .map((r) => ({ slug: r.box.slug, reason: r.reason.slice(0, 140) }));

  return {
    intent: {
      occasion: raw.intent?.occasion ?? input.occasion,
      relationship: raw.intent?.relationship ?? input.relationship,
      budgetPaise: raw.intent?.budgetPaise ?? input.budgetPaise,
      tags: raw.intent?.tags ?? [],
    },
    products,
    readyBoxes,
    buildBoxSuggested: Boolean(raw.buildBoxSuggested),
    note: (raw.note ?? "").slice(0, 300),
  };
}

// ------------------------------------------------------------------
// Gift Box Builder
// ------------------------------------------------------------------

export type BuildBoxInput = {
  occasion?: string;
  relationship?: string;
  budgetPaise?: number;
  preferences?: string;
  userId?: string;
};

export type BuildBoxResult = {
  emptyBoxSlug: string;
  items: { productSlug: string; quantity: number }[];
  ribbonSlug?: string;
  fillerSlug?: string;
  cardSlug?: string;
  giftNote: string;
  totalPaise: number;
  notes: string[]; // human-readable adjustments the server made
};

type RawBuildBox = {
  emptyBoxSlug?: string;
  items?: { productSlug: string; quantity: number }[];
  ribbonSlug?: string;
  fillerSlug?: string;
  cardSlug?: string;
  giftNote?: string;
};

export async function buildGiftBox(input: BuildBoxInput): Promise<BuildBoxResult> {
  const productCatalog = safeProductCatalog().filter((p) => p.isGiftBoxCompatible);
  const boxCatalog = safeBoxCatalog();
  const addOns = safeAddOns();

  const system = getPrompt("builder");
  const user = [
    `Occasion: ${input.occasion ?? "unspecified"}`,
    `Relationship: ${input.relationship ?? "unspecified"}`,
    input.budgetPaise ? `Budget: ${input.budgetPaise} paise (₹${(input.budgetPaise / 100).toFixed(0)})` : "Budget: flexible",
    `Preferences: ${input.preferences ?? "none"}`,
    "",
    "Empty gift boxes:", JSON.stringify(boxCatalog),
    "Gift-box compatible products:", JSON.stringify(productCatalog),
    "Add-ons:", JSON.stringify(addOns),
    "",
    "Choose ONE empty box, then fill it with 2-5 products, staying within the box's capacity, maxWeightGrams and allowedCategories. Respect the budget (sum of everything <= budget when set). Pick a ribbon, filler and greeting card (or their 'no-*' variants). Write a warm 1-2 sentence gift note.",
    "Return strict JSON:",
    `{
  "emptyBoxSlug": string,
  "items": [{"productSlug": string, "quantity": number}],
  "ribbonSlug": string,
  "fillerSlug": string,
  "cardSlug": string,
  "giftNote": string
}`,
  ].join("\n");

  const raw = await aiChatJSON<RawBuildBox>({
    feature: "builder",
    userId: input.userId,
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return validateBuild(raw, input);
}

function validateBuild(raw: RawBuildBox, input: BuildBoxInput): BuildBoxResult {
  const notes: string[] = [];
  let box: EmptyGiftBox | undefined = raw.emptyBoxSlug ? findEmptyBoxBySlug(raw.emptyBoxSlug) : undefined;
  if (!box) {
    box = (findEmptyBoxBySlug("signature-black-3") ?? undefined);
    notes.push("Chose default box (AI suggestion was invalid).");
  }
  if (!box) throw new Error("AI_NO_BOX");

  let items: { productSlug: string; quantity: number }[] = [];
  let usedSlots = 0;
  let usedWeight = 0;
  let productsCost = 0;

  for (const raw_it of raw.items ?? []) {
    const p = findProductBySlug(raw_it.productSlug);
    if (!p) { notes.push(`Skipped unknown item: ${raw_it.productSlug}`); continue; }
    if (p.stock <= 0) { notes.push(`Skipped out-of-stock: ${p.name}`); continue; }
    if (!p.isGiftBoxCompatible) { notes.push(`Skipped (not gift-box compatible): ${p.name}`); continue; }
    if (box.allowedCategories.length && !box.allowedCategories.includes(p.category)) {
      notes.push(`Skipped (category not allowed): ${p.name}`); continue;
    }
    let qty = Math.max(1, Math.min(raw_it.quantity ?? 1, p.stock, 5));
    // Enforce capacity
    if (usedSlots + qty > box.capacity) qty = box.capacity - usedSlots;
    if (qty <= 0) { notes.push(`Skipped (box full): ${p.name}`); continue; }
    // Enforce weight
    if (usedWeight + p.weightGrams * qty > box.maxWeightGrams) {
      const remWeight = box.maxWeightGrams - usedWeight;
      const maxByWeight = Math.floor(remWeight / p.weightGrams);
      qty = Math.max(0, Math.min(qty, maxByWeight));
      if (qty <= 0) { notes.push(`Skipped (weight limit): ${p.name}`); continue; }
    }
    items.push({ productSlug: p.slug, quantity: qty });
    usedSlots += qty;
    usedWeight += p.weightGrams * qty;
    productsCost += p.pricePaise * qty;
  }

  const ribbon = ribbons.find((r) => r.slug === raw.ribbonSlug) ?? ribbons[0];
  const filler = fillers.find((r) => r.slug === raw.fillerSlug) ?? fillers[0];
  const card = greetingCards.find((r) => r.slug === raw.cardSlug) ?? greetingCards[0];

  let total = box.pricePaise + productsCost + ribbon.pricePaise + filler.pricePaise + card.pricePaise;

  // Fallback: if the AI's picks were all filtered out, greedily fill the box
  // with the highest-rated compatible in-stock products so the user isn't
  // left with an empty gift box.
  if (items.length === 0) {
    const budgetCap = input.budgetPaise ?? Number.POSITIVE_INFINITY;
    const candidates = allProducts
      .filter((p) => p.stock > 0 && p.isGiftBoxCompatible)
      .filter((p) => !box.allowedCategories.length || box.allowedCategories.includes(p.category))
      .filter((p) => usedWeight + p.weightGrams <= box.maxWeightGrams)
      .filter((p) => total + p.pricePaise <= budgetCap)
      .sort((a, b) => b.rating - a.rating || a.pricePaise - b.pricePaise);
    for (const p of candidates) {
      if (usedSlots >= box.capacity) break;
      if (usedWeight + p.weightGrams > box.maxWeightGrams) continue;
      if (total + p.pricePaise > budgetCap) continue;
      items.push({ productSlug: p.slug, quantity: 1 });
      usedSlots += 1;
      usedWeight += p.weightGrams;
      productsCost += p.pricePaise;
      total += p.pricePaise;
    }
    if (items.length > 0) notes.push("AI's picks didn't fit this box — auto-filled with matching products.");
  }

  // Enforce budget by trimming quantities from the last item, then removing items.
  if (input.budgetPaise && total > input.budgetPaise && items.length > 0) {
    while (total > input.budgetPaise && items.length > 0) {
      const last = items[items.length - 1];
      const p = findProductBySlug(last.productSlug)!;
      if (last.quantity > 1) {
        last.quantity -= 1;
        total -= p.pricePaise;
      } else {
        items.pop();
        total -= p.pricePaise;
      }
    }
    notes.push("Trimmed contents to fit budget.");
  }

  return {
    emptyBoxSlug: box.slug,
    items,
    ribbonSlug: ribbon.slug,
    fillerSlug: filler.slug,
    cardSlug: card.slug,
    giftNote: (raw.giftNote ?? "").slice(0, 300),
    totalPaise: total,
    notes,
  };
}
