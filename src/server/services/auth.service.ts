import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { auditLogs, users, userRoles } from "../db/schema";
import { env } from "../env";
import { hashPassword, verifyPassword } from "../lib/password";
import { createSession, destroySession, getSessionUser, type SessionUser } from "../lib/session";

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8).max(200);

export type SignUpInput = { name: string; email: string; password: string };
export type SignInInput = { email: string; password: string };

export const authService = {
  async signUp(input: SignUpInput, meta: { ip?: string; ua?: string } = {}) {
    const email = emailSchema.parse(input.email);
    const password = passwordSchema.parse(input.password);
    const name = input.name.trim().slice(0, 200);

    // Uniqueness check
    const existing = await db().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      throw new AuthError("An account with this email already exists.");
    }

    const passwordHash = hashPassword(password);
    const [created] = await db()
      .insert(users)
      .values({ email, name, passwordHash })
      .returning({ id: users.id });

    // PUBLIC SIGNUP CAN ONLY CREATE CUSTOMERS. Never super_admin, never staff.
    await db().insert(userRoles).values({ userId: created.id, role: "customer" });

    await db()
      .insert(auditLogs)
      .values({ actorId: created.id, action: "auth.signup", entityType: "user", entityId: created.id, ip: meta.ip, userAgent: meta.ua });

    const { token, expiresAt } = await createSession(created.id, meta);
    return { userId: created.id, token, expiresAt };
  },

  async signIn(input: SignInInput, meta: { ip?: string; ua?: string } = {}) {
    const email = emailSchema.parse(input.email);
    const password = passwordSchema.parse(input.password);

    const [row] = await db()
      .select({ id: users.id, passwordHash: users.passwordHash, disabledAt: users.disabledAt, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!row || !row.passwordHash || row.disabledAt || row.deletedAt) {
      throw new AuthError("Invalid email or password.");
    }
    if (!verifyPassword(password, row.passwordHash)) {
      throw new AuthError("Invalid email or password.");
    }

    await db()
      .insert(auditLogs)
      .values({ actorId: row.id, action: "auth.signin", entityType: "user", entityId: row.id, ip: meta.ip, userAgent: meta.ua });

    const { token, expiresAt } = await createSession(row.id, meta);
    return { userId: row.id, token, expiresAt };
  },

  async signOut(token: string | null | undefined) {
    await destroySession(token);
  },

  async me(token: string | null | undefined): Promise<SessionUser | null> {
    return getSessionUser(token);
  },

  /**
   * Idempotent super-admin seed. Called once at bootstrap from env.
   * SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD from server config only.
   */
  async ensureSuperAdmin() {
    const email = emailSchema.parse(env().SUPER_ADMIN_EMAIL);
    const password = env().SUPER_ADMIN_PASSWORD;

    const [existing] = await db()
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;
    if (existing) {
      // Only rehash if the password hash is missing (never overwrite an existing one silently).
      if (!existing.passwordHash) {
        await db().update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, existing.id));
      }
      userId = existing.id;
    } else {
      const [created] = await db()
        .insert(users)
        .values({ email, name: "Super Admin", passwordHash: hashPassword(password), emailVerifiedAt: new Date() })
        .returning({ id: users.id });
      userId = created.id;
    }

    // Ensure super_admin role (idempotent)
    const [hasRole] = await db()
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "super_admin")))
      .limit(1);
    if (!hasRole) {
      await db().insert(userRoles).values({ userId, role: "super_admin" });
    }

    return { userId, email };
  },
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
