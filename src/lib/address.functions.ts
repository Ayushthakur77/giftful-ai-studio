import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SESSION_COOKIE = "giftty_session";

async function requireUserId(): Promise<string> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  const me = await authService.me(token);
  if (!me) throw new Response("Unauthorized", { status: 401 });
  return me.id;
}

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

export const listAddressesFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const { addressService } = await import("@/server/services/address.service");
  return addressService.list(userId);
});

export const createAddressFn = createServerFn({ method: "POST" })
  .inputValidator((d) => addressPayload.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const { addressService } = await import("@/server/services/address.service");
    try {
      return { ok: true as const, address: await addressService.create(userId, data) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const updateAddressFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).and(addressPayload).parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const { addressService } = await import("@/server/services/address.service");
    const { id, ...rest } = data;
    try {
      return { ok: true as const, address: await addressService.update(userId, id, rest) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const deleteAddressFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const { addressService } = await import("@/server/services/address.service");
    return addressService.remove(userId, data.id);
  });

export const setDefaultAddressFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const { addressService } = await import("@/server/services/address.service");
    await addressService.setDefault(userId, data.id);
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
