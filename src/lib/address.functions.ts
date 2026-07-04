import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const addressPayload = z.object({
  label: z.string().trim().max(40).optional().nullable(),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\+?\d{7,15}$/u, "Enter a valid phone"),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/u, "6-digit PIN required"),
  country: z.string().trim().length(2).default("IN"),
  isDefault: z.boolean().optional().default(false),
});

export type AddressPayload = z.infer<typeof addressPayload>;

type DbRow = {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
};

function toDto(r: DbRow): Address {
  return {
    id: r.id,
    label: r.label,
    fullName: r.full_name,
    phone: r.phone,
    line1: r.line1,
    line2: r.line2,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    country: r.country,
    isDefault: r.is_default,
    createdAt: r.created_at,
  };
}

function toRow(p: AddressPayload) {
  return {
    label: p.label ?? null,
    full_name: p.fullName,
    phone: p.phone,
    line1: p.line1,
    line2: p.line2 ?? null,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    country: p.country || "IN",
    is_default: p.isDefault ?? false,
  };
}

async function clearOtherDefaults(supabase: any, userId: string, exceptId?: string) {
  let q = supabase.from("addresses").update({ is_default: false }).eq("user_id", userId).eq("is_default", true);
  if (exceptId) q = q.neq("id", exceptId);
  await q;
}

export const listAddressesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as DbRow[]).map(toDto);
  });

export const createAddressFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => addressPayload.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const row = { ...toRow(data), user_id: context.userId };
      if (row.is_default) await clearOtherDefaults(context.supabase, context.userId);
      // If user has no addresses yet, make first one default automatically.
      const { count } = await context.supabase
        .from("addresses").select("id", { count: "exact", head: true });
      if ((count ?? 0) === 0) row.is_default = true;
      const { data: created, error } = await context.supabase
        .from("addresses").insert(row).select("*").single();
      if (error) throw new Error(error.message);
      return { ok: true as const, address: toDto(created as DbRow) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const updateAddressFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).and(addressPayload).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { id, ...rest } = data;
      const row = toRow(rest);
      if (row.is_default) await clearOtherDefaults(context.supabase, context.userId, id);
      const { data: updated, error } = await context.supabase
        .from("addresses").update(row).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return { ok: true as const, address: toDto(updated as DbRow) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const deleteAddressFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("addresses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setDefaultAddressFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await clearOtherDefaults(context.supabase, context.userId, data.id);
    const { error } = await context.supabase
      .from("addresses").update({ is_default: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Reverse geocode via free Nominatim service. Best-effort, returns partial data.
export const reverseGeocodeFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ lat: z.number(), lng: z.number() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${data.lat}&lon=${data.lng}&addressdetails=1`;
      const res = await fetch(url, { headers: { "User-Agent": "Giftty/1.0 (contact@giftty.example)", Accept: "application/json" } });
      if (!res.ok) return { ok: false as const, error: "Lookup failed" };
      const json = (await res.json()) as { address?: Record<string, string> };
      const a = json.address ?? {};
      return {
        ok: true as const,
        city: a.city || a.town || a.village || a.county || "",
        state: a.state || "",
        pincode: a.postcode || "",
        country: (a.country_code || "in").toUpperCase().slice(0, 2),
      };
    } catch {
      return { ok: false as const, error: "Lookup failed" };
    }
  });
