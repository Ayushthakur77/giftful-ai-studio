import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";

import { db } from "../db/client";
import { sessions, users, userRoles } from "../db/schema";
import type { InferSelectModel } from "drizzle-orm";

export const SESSION_COOKIE = "giftty_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles: ("super_admin" | "staff" | "customer")[];
  isSuperAdmin: boolean;
};

export function newSessionToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, meta: { ip?: string; ua?: string } = {}) {
  const { token, hash } = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db().insert(sessions).values({
    userId,
    tokenHash: hash,
    expiresAt,
    ip: meta.ip,
    userAgent: meta.ua,
  });
  return { token, expiresAt };
}

export async function getSessionUser(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const hash = hashToken(token);
  const now = new Date();
  const rows = await db()
    .select({
      user: users,
      role: userRoles.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .where(and(eq(sessions.tokenHash, hash), gt(sessions.expiresAt, now)));

  if (rows.length === 0) return null;
  const user = rows[0].user as InferSelectModel<typeof users>;
  if (user.deletedAt || user.disabledAt) return null;

  const roles = Array.from(
    new Set(rows.map((r) => r.role).filter(Boolean)),
  ) as SessionUser["roles"];

  // Sliding session — touch last_seen
  await db()
    .update(sessions)
    .set({ lastSeenAt: now })
    .where(eq(sessions.tokenHash, hash));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles,
    isSuperAdmin: roles.includes("super_admin"),
  };
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  const hash = hashToken(token);
  await db().delete(sessions).where(eq(sessions.tokenHash, hash));
}
