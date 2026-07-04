import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { findProductBySlug, relatedProducts } from "@/lib/catalog";

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Fetch full details for a single Giftty product by slug, including related products.",
  inputSchema: {
    slug: z.string().trim().describe("Product slug (e.g. 'midnight-belgian-truffle-cake')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug }) => {
    const p = findProductBySlug(slug);
    if (!p) {
      return {
        content: [{ type: "text", text: `No product found with slug: ${slug}` }],
        isError: true,
      };
    }
    const payload = {
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      category: p.category,
      occasions: p.occasions,
      recipients: p.recipients,
      tags: p.tags,
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      weightGrams: p.weightGrams,
      stock: p.stock,
      rating: p.rating,
      ratingCount: p.ratingCount,
      badge: p.badge,
      isPersonalizable: p.isPersonalizable,
      isGiftBoxCompatible: p.isGiftBoxCompatible,
      related: relatedProducts(slug, 6).map((r) => ({
        slug: r.slug,
        name: r.name,
        pricePaise: r.pricePaise,
      })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
