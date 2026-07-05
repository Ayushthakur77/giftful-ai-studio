/**
 * Reviews — public read (approved only) + authenticated submit.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  author: string;
};

export const listProductReviewsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ productSlug: z.string(), limit: z.number().int().min(1).max(50).default(20) }).parse(raw))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: prod } = await sb.from("products").select("id").eq("slug", data.productSlug).maybeSingle();
    if (!prod) return { reviews: [] as PublicReview[], avg: 0, count: 0 };

    const [{ data: rows }, stats] = await Promise.all([
      sb.from("reviews")
        .select("id,rating,title,body,created_at,user_id,profiles!inner(name)")
        .eq("product_id", prod.id).eq("status", "approved")
        .order("created_at", { ascending: false }).limit(data.limit),
      sb.rpc("product_review_stats", { _product_id: prod.id }).maybeSingle(),
    ]);

    const reviews: PublicReview[] = (rows ?? []).map((r: any) => ({
      id: r.id, rating: r.rating, title: r.title, body: r.body,
      created_at: r.created_at,
      author: r.profiles?.name ?? "Verified buyer",
    }));
    const s: any = stats.data ?? { avg_rating: 0, review_count: 0 };
    return { reviews, avg: Number(s.avg_rating) || 0, count: Number(s.review_count) || 0 };
  });

export const submitReviewFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      productSlug: z.string(),
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().max(120).optional(),
      body: z.string().trim().max(2000).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: prod } = await sb.from("products").select("id").eq("slug", data.productSlug).maybeSingle();
    if (!prod) throw new Error("Product not found");

    const { error } = await sb.from("reviews").insert({
      product_id: prod.id,
      user_id: context.userId,
      rating: data.rating,
      title: data.title ?? null,
      body: data.body ?? null,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true, status: "pending" as const };
  });

export const incrementProductViewFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const sb = publicClient();
    await sb.rpc("increment_product_view", { _slug: data.slug });
    return { ok: true };
  });
