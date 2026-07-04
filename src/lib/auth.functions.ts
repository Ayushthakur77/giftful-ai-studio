import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Client-callable server fns for auth. All server-only imports
 * (`@tanstack/react-start/server`, `@/server/*`) are dynamic-imported
 * inside .handler() to keep them out of the client bundle.
 */
const SESSION_COOKIE = "giftty_session";

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

async function serverUtils() {
  return await import("@tanstack/react-start/server");
}

function baseCookieOpts(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((data) => signUpInput.parse(data))
  .handler(async ({ data }) => {
    const { setCookie, getRequestHeader } = await serverUtils();
    const { authService, AuthError } = await import("@/server/services/auth.service");
    const meta = {
      ip: getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? undefined,
      ua: getRequestHeader("user-agent") ?? undefined,
    };
    try {
      const { token, expiresAt } = await authService.signUp(data, meta);
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
    const { setCookie, getRequestHeader } = await serverUtils();
    const { authService, AuthError } = await import("@/server/services/auth.service");
    const meta = {
      ip: getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? undefined,
      ua: getRequestHeader("user-agent") ?? undefined,
    };
    try {
      const { token, expiresAt } = await authService.signIn(data, meta);
      setCookie(SESSION_COOKIE, token, baseCookieOpts(expiresAt));
      return { ok: true as const };
    } catch (err) {
      if (err instanceof AuthError) return { ok: false as const, error: err.message };
      throw err;
    }
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getCookie, deleteCookie } = await serverUtils();
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  await authService.signOut(token);
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true as const };
});

export const meFn = createServerFn({ method: "GET" }).handler(async (): Promise<PublicSessionUser | null> => {
  const { getCookie } = await serverUtils();
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  return authService.me(token);
});
