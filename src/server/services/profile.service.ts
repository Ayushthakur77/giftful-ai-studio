import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { addresses, auditLogs, notifications, sessions, users, wishlists } from "../db/schema";
import { hashToken } from "../lib/session";

export const profileUpdateInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{7,15}$/u, "Enter a valid phone")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url().max(2048).optional().or(z.literal("")),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateInput>;

export const profileService = {
  async get(userId: string) {
    const [row] = await db()
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        phone: users.phone,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row ?? null;
  },

  async update(userId: string, input: ProfileUpdateInput) {
    const data = profileUpdateInput.parse(input);
    const [row] = await db()
      .update(users)
      .set({
        name: data.name,
        phone: data.phone ? data.phone : null,
        avatarUrl: data.avatarUrl ? data.avatarUrl : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    await db().insert(auditLogs).values({ actorId: userId, action: "profile.update", entityType: "user", entityId: userId });
    return row;
  },

  async stats(userId: string) {
    const [addr] = await db().select({ n: sql<number>`count(*)::int` }).from(addresses).where(eq(addresses.userId, userId));
    const [wl] = await db().select({ n: sql<number>`count(*)::int` }).from(wishlists).where(eq(wishlists.userId, userId));
    const [notif] = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), sql`${notifications.readAt} is null`));
    return { addressCount: addr?.n ?? 0, wishlistCount: wl?.n ?? 0, unreadNotifications: notif?.n ?? 0 };
  },

  async listSessions(userId: string, currentToken: string | null) {
    const currentHash = currentToken ? hashToken(currentToken) : null;
    const rows = await db()
      .select({
        id: sessions.id,
        tokenHash: sessions.tokenHash,
        ip: sessions.ip,
        userAgent: sessions.userAgent,
        createdAt: sessions.createdAt,
        lastSeenAt: sessions.lastSeenAt,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
      lastSeenAt: r.lastSeenAt,
      expiresAt: r.expiresAt,
      isCurrent: currentHash !== null && r.tokenHash === currentHash,
    }));
  },

  async signOutOthers(userId: string, currentToken: string | null) {
    if (!currentToken) return { removed: 0 };
    const currentHash = hashToken(currentToken);
    const removed = await db()
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, currentHash)))
      .returning({ id: sessions.id });
    await db().insert(auditLogs).values({ actorId: userId, action: "sessions.revoke_others" });
    return { removed: removed.length };
  },

  async deleteAccount(userId: string) {
    // Soft delete + destroy sessions + scramble email for uniqueness
    const nonce = Math.random().toString(36).slice(2, 10);
    await db()
      .update(users)
      .set({ deletedAt: new Date(), email: sql`${users.email} || '.deleted.' || ${nonce}`, passwordHash: null })
      .where(eq(users.id, userId));
    await db().delete(sessions).where(eq(sessions.userId, userId));
    await db().insert(auditLogs).values({ actorId: userId, action: "account.delete", entityType: "user", entityId: userId });
    return { ok: true as const };
  },
};
