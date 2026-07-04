/**
 * Natural-language product search.
 *
 * The model returns structured filters + a ranked slug list. We then
 * re-query the live catalog with those filters and re-order results by
 * the model's ranking, filtering unknown/out-of-stock slugs.
 */
import { aiChatJSON } from "./ai-gateway.service";
import { getPrompt } from "./ai-settings.service";
import { safeProductCatalog } from "./ai-context.service";
import { listProducts, findProductBySlug, type Product } from "@/lib/catalog";

export type AiSearchResult = {
  interpretation: string;
  results: { product: Product; reason: string }[];
};

type Raw = {
  interpretation?: string;
  filters?: {
    category?: string;
    occasion?: string;
    recipient?: string;
    priceMaxPaise?: number;
    tags?: string[];
  };
  ranking?: { slug: string; reason?: string }[];
};

export async function aiSearch(query: string, userId?: string): Promise<AiSearchResult> {
  const catalog = safeProductCatalog();
  const system = getPrompt("search");
  const user = [
    `Query: "${query}"`,
    "",
    "Catalog (JSON):",
    JSON.stringify(catalog),
    "",
    "Return strict JSON:",
    `{
  "interpretation": string,
  "filters": { "category": string|null, "occasion": string|null, "recipient": string|null, "priceMaxPaise": number|null, "tags": string[] },
  "ranking": [{ "slug": string, "reason": string (max 80 chars) }]  // ordered best first, up to 12
}`,
    "Choose slugs only from the catalog. If nothing matches, return an empty ranking.",
  ].join("\n");

  const raw = await aiChatJSON<Raw>({
    feature: "search",
    userId,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const validCats = new Set(["personalized", "flowers", "cakes", "chocolates", "hampers", "corporate"]);
  const validOcc  = new Set(["birthday", "anniversary", "wedding", "rakhi", "diwali", "corporate"]);
  const validRec  = new Set(["him", "her", "kids", "parents", "couple", "colleagues"]);

  const filters: Parameters<typeof listProducts>[0] = {
    category: validCats.has(raw.filters?.category ?? "") ? (raw.filters!.category as Product["category"]) : undefined,
    occasion: validOcc.has(raw.filters?.occasion ?? "") ? (raw.filters!.occasion as Product["occasions"][number]) : undefined,
    recipient: validRec.has(raw.filters?.recipient ?? "") ? (raw.filters!.recipient as Product["recipients"][number]) : undefined,
    maxPrice: raw.filters?.priceMaxPaise && raw.filters.priceMaxPaise > 0 ? raw.filters.priceMaxPaise : undefined,
    inStockOnly: true,
  };

  const pool = listProducts(filters, "popularity");
  const poolSet = new Set(pool.map((p) => p.slug));

  const ranked = (raw.ranking ?? [])
    .map((r) => ({ p: findProductBySlug(r.slug), reason: (r.reason ?? "").slice(0, 120) }))
    .filter((r): r is { p: Product; reason: string } => !!r.p && r.p.stock > 0 && poolSet.has(r.p.slug))
    .slice(0, 12);

  // Fall back to plain catalog matches if AI ranking is empty
  const results = ranked.length > 0
    ? ranked.map((r) => ({ product: r.p, reason: r.reason }))
    : pool.slice(0, 12).map((p) => ({ product: p, reason: "" }));

  return {
    interpretation: (raw.interpretation ?? "").slice(0, 200),
    results,
  };
}
