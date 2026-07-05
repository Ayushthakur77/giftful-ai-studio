/**
 * Admin CRUD for `public.testimonials`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdmin, logAudit } from "./admin-shared";

export const adminListTestimonialsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("testimonials")
      .select("*").order("sort_order", { ascending: true });
    return data ?? [];
  });

const testimonialInput = z.object({
  id: z.string().uuid().optional(),
  author_name: z.string().min(1).max(120),
  author_city: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  rating: z.number().int().min(1).max(5).default(5),
  quote: z.string().min(1).max(1000),
  sort_order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export const adminUpsertTestimonialFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => testimonialInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("testimonials").update(data as never).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "testimonial.update", entity: "testimonials", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("testimonials").insert(data as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "testimonial.create", entity: "testimonials", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteTestimonialFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("testimonials").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "testimonial.delete", entity: "testimonials", entityId: data.id });
    return { ok: true as const };
  });
