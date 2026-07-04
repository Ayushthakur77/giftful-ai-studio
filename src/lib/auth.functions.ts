import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Client-callable server fns for auth. Server-only modules are loaded
 * dynamically inside .handler() so nothing in src/server/ leaks to the
 * client bundle.
 */
const SESSION_COOKIE = "giftty_session";

function baseCookieOpts(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

function reqMeta() {
  return {
    ip: getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? undefined,
    ua: getRequestHeader("user-agent") ?? undefined,
  };
}

export type PublicSessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles: ("super_admin" | "staff" | "customer")[];
  isSuperAdmin: boolean;
};

const signUpInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

const signInInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((data) => signUpInput.parse(data))
  .handler(async ({ data }) => {
    const { authService, AuthError } = await import("@/server/services/auth.service");
    try {
      const { token, expiresAt } = await authService.signUp(data, reqMeta());
      setCookie(SESSION_COOKIE, token, baseCookieOpts(expiresAt));
      return { ok: true as const };
    } catch (err) {
      if (err instanceof AuthError) return { ok: false as const, error: err.message };
      throw err;
    }
  });

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((data) => signInInput.parse(data))
  .handler(async ({ data }) => {
    const { authService, AuthError } = await import("@/server/services/auth.service");
    try {
      const { token, expiresAt } = await authService.signIn(data, reqMeta());
      setCookie(SESSION_COOKIE, token, baseCookieOpts(expiresAt));
      return { ok: true as const };
    } catch (err) {
      if (err instanceof AuthError) return { ok: false as const, error: err.message };
      throw err;
    }
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  await authService.signOut(token);
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true as const };
});

export const meFn = createServerFn({ method: "GET" }).handler(async (): Promise<PublicSessionUser | null> => {
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  const user = await authService.me(token);
  return user;
});
