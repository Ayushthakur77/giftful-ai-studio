import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import type { BrowserSearch } from "@/components/shop/shop-browser";

/**
 * Shared Zod schema for the shop/catalog list URL search params.
 * Used by /search, /c/$category, /c/$category/$subcategory, /o/$occasion.
 */
export const browserSearchSchema = z.object({
  q: z.string().max(120).optional(),
  category: z.enum(["personalized", "flowers", "cakes", "chocolates", "hampers", "corporate"]).optional(),
  occasion: z.enum(["birthday", "anniversary", "wedding", "rakhi", "diwali", "corporate"]).optional(),
  recipient: z.enum(["him", "her", "kids", "parents", "couple", "colleagues"]).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  discount: z.boolean().optional(),
  personalizable: z.boolean().optional(),
  giftBoxCompat: z.boolean().optional(),
  inStock: z.boolean().optional(),
  sort: z.enum(["popularity", "newest", "price-asc", "price-desc", "rating", "discount"]).optional(),
  view: z.enum(["grid", "list"]).optional(),
  page: z.number().int().min(1).optional(),
});

export const browserSearchValidator = zodValidator(browserSearchSchema);

export type BrowserSearchParams = BrowserSearch;
