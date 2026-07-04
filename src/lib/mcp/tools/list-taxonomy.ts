import { defineTool } from "@lovable.dev/mcp-js";
import {
  categories,
  occasions,
  recipients,
  emptyGiftBoxes,
  readyMadeGiftBoxes,
} from "@/lib/catalog";

export default defineTool({
  name: "list_taxonomy",
  title: "List taxonomy",
  description:
    "List Giftty's browsable taxonomy: categories, occasions, recipients, empty gift boxes, and ready-made gift boxes. Useful before calling search_products.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const payload = {
      categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
      occasions,
      recipients,
      emptyGiftBoxes: emptyGiftBoxes.map((b) => ({
        slug: b.slug,
        name: b.name,
        pricePaise: b.pricePaise,
        capacity: b.capacity,
        maxWeightGrams: b.maxWeightGrams,
        allowedCategories: b.allowedCategories,
      })),
      readyMadeGiftBoxes: readyMadeGiftBoxes.map((b) => ({
        slug: b.slug,
        name: b.name,
        pricePaise: b.pricePaise,
        description: b.description,
      })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
