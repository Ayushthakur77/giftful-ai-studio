import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { listProducts } from "@/lib/catalog";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search Giftty's gift catalog by keyword, category, occasion, recipient, price and rating. Returns compact product summaries.",
  inputSchema: {
    query: z.string().trim().optional().describe("Free-text search across name, description, tags."),
    category: z
      .enum(["personalized", "flowers", "cakes", "chocolates", "hampers", "corporate"])
      .optional(),
    occasion: z
      .enum(["birthday", "anniversary", "wedding", "rakhi", "diwali", "corporate"])
      .optional(),
    recipient: z
      .enum(["him", "her", "kids", "parents", "couple", "colleagues"])
      .optional(),
    minPricePaise: z.number().int().min(0).optional(),
    maxPricePaise: z.number().int().min(0).optional(),
    inStockOnly: z.boolean().optional(),
    personalizableOnly: z.boolean().optional(),
    giftBoxCompatibleOnly: z.boolean().optional(),
    sort: z
      .enum(["popularity", "newest", "price-asc", "price-desc", "rating", "discount"])
      .optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const limit = input.limit ?? 20;
    const results = listProducts(
      {
        q: input.query,
        category: input.category,
        occasion: input.occasion,
        recipient: input.recipient,
        minPrice: input.minPricePaise,
        maxPrice: input.maxPricePaise,
        inStockOnly: input.inStockOnly,
        personalizableOnly: input.personalizableOnly,
        giftBoxCompatibleOnly: input.giftBoxCompatibleOnly,
      },
      input.sort ?? "popularity",
    )
      .slice(0, limit)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        category: p.category,
        pricePaise: p.pricePaise,
        mrpPaise: p.mrpPaise,
        rating: p.rating,
        ratingCount: p.ratingCount,
        stock: p.stock,
        isPersonalizable: p.isPersonalizable,
        isGiftBoxCompatible: p.isGiftBoxCompatible,
        occasions: p.occasions,
        recipients: p.recipients,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify({ count: results.length, results }) }],
      structuredContent: { count: results.length, results },
    };
  },
});
