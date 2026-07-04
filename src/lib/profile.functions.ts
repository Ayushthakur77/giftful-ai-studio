import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ProfileRow = {
  id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

async function ensureProfile(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data) return data as ProfileRow;
  const { data: created } = await supabase.from("profiles").insert({ id: userId }).select("*").single();
  return created as ProfileRow;
}

export const getProfileFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const row = await ensureProfile(context.supabase, context.userId);
    const email = (context.claims as { email?: string })?.email ?? "";

    const [{ count: addressCount }] = await Promise.all([
      context.supabase.from("addresses").select("id", { count: "exact", head: true }),
    ]);

    return {
      profile: {
        id: row.id,
        email,
        name: row.name,
        phone: row.phone,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
      },
      stats: {
        addressCount: addressCount ?? 0,
        wishlistCount: 0,
        unreadNotifications: 0,
      },
    };
  });

const updateInput = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  avatarUrl: z.string().trim().max(2048).optional().or(z.literal("")),
});

export const updateProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      await ensureProfile(context.supabase, context.userId);
      const { error } = await context.supabase
        .from("profiles")
        .update({
          name: data.name,
          phone: data.phone || null,
          avatar_url: data.avatarUrl || null,
        })
        .eq("id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Update failed" };
    }
  });

// Supabase manages sessions internally — we surface only the current device.
export const listSessionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return [{
      id: "current",
      userAgent: "This browser",
      ip: null as string | null,
      lastSeenAt: new Date().toISOString(),
      isCurrent: true,
    }];
  });

export const signOutOthersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ removed: number }> => {
    // Placeholder — global sign-out will land alongside the security phase.
    return { removed: 0 };
  });

export const deleteAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ confirm: z.literal("DELETE") }).parse(d))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
