/**
 * Compact, PII-free catalog snapshot for AI prompts.
 *
 * The model only sees prices, slugs and rules — never customer data.
 * Snapshots are re-built per request from the isomorphic catalog module
 * so out-of-stock items and disabled products never leak into
 * recommendations.
 */
import {
  products,
  emptyGiftBoxes,
  readyMadeGiftBoxes,
  ribbons,
  fillers,
  greetingCards,
} from "@/lib/catalog";

export function safeProductCatalog() {
  return products
    .filter((p) => p.stock > 0)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      occasions: p.occasions,
      recipients: p.recipients,
      tags: p.tags,
      pricePaise: p.pricePaise,
      weightGrams: p.weightGrams,
      stock: p.stock,
      isPersonalizable: p.isPersonalizable,
      isGiftBoxCompatible: p.isGiftBoxCompatible,
    }));
}

export function safeBoxCatalog() {
  return emptyGiftBoxes.map((b) => ({
    slug: b.slug,
    name: b.name,
    pricePaise: b.pricePaise,
    capacity: b.capacity,
    maxWeightGrams: b.maxWeightGrams,
    allowedCategories: b.allowedCategories,
  }));
}

export function safeReadyBoxes() {
  return readyMadeGiftBoxes.map((b) => ({
    slug: b.slug,
    name: b.name,
    pricePaise: b.pricePaise,
    contents: b.contents,
  }));
}

export function safeAddOns() {
  return {
    ribbons: ribbons.map((r) => ({ slug: r.slug, name: r.name, pricePaise: r.pricePaise })),
    fillers: fillers.map((r) => ({ slug: r.slug, name: r.name, pricePaise: r.pricePaise })),
    cards: greetingCards.map((r) => ({ slug: r.slug, name: r.name, pricePaise: r.pricePaise })),
  };
}
