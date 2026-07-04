import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "recommend_gifts",
  title: "Recommend gifts",
  description:
    "Ask Giftty's AI to recommend gift products and ready-made boxes for a described recipient and occasion. Returns validated in-stock catalog matches plus a warm gift-note draft.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .describe("Describe the recipient and occasion, e.g. 'birthday gift for my wife who loves chai'."),
    occasion: z.string().optional(),
    relationship: z.string().optional(),
    budgetPaise: z.number().int().min(0).optional().describe("Budget in paise (₹1 = 100 paise)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async (input) => {
    const { recommendGifts } = await import("@/server/services/ai-recommend.service");
    try {
      const result = await recommendGifts({
        query: input.query,
        occasion: input.occasion,
        relationship: input.relationship,
        budgetPaise: input.budgetPaise,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text", text: `Giftty AI unavailable: ${msg}` }],
        isError: true,
      };
    }
  },
});
