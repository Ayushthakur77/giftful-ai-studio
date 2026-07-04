import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { addresses } from "../db/schema";

export const addressInput = z.object({
  label: z.string().trim().max(40).optional().nullable(),
  fullName: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().regex(/^\+?\d{7,15}$/u, "Enter a valid phone"),
  line1: z.string().trim().min(1, "House/Flat is required").max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/u, "6-digit PIN required"),
  country: z.string().trim().length(2).default("IN"),
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof addressInput>;

async function clearDefault(userId: string) {
  await db()
    .update(addresses)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
}

export const addressService = {
  async list(userId: string) {
    return db()
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.updatedAt));
  },

  async create(userId: string, input: AddressInput) {
    const data = addressInput.parse(input);
    // Auto default if user has none
    const existing = await db().select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId)).limit(1);
    const makeDefault = data.isDefault || existing.length === 0;
    if (makeDefault) await clearDefault(userId);
    const [row] = await db()
      .insert(addresses)
      .values({ ...data, userId, isDefault: makeDefault })
      .returning();
    return row;
  },

  async update(userId: string, id: string, input: AddressInput) {
    const data = addressInput.parse(input);
    if (data.isDefault) await clearDefault(userId);
    const [row] = await db()
      .update(addresses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();
    if (!row) throw new Error("Address not found");
    return row;
  },

  async remove(userId: string, id: string) {
    await db().delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
    // If no default remains, promote most recent
    const rows = await db().select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.updatedAt));
    if (rows.length > 0 && !rows.some((r) => r.isDefault)) {
      await db().update(addresses).set({ isDefault: true }).where(eq(addresses.id, rows[0].id));
    }
    return { ok: true as const };
  },

  async setDefault(userId: string, id: string) {
    await clearDefault(userId);
    const [row] = await db()
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();
    if (!row) throw new Error("Address not found");
    return row;
  },
};
