import { createServerFn } from "@tanstack/react-start";

/**
 * SSR helper that hydrates the router with the current session on every
 * navigation. Kept in src/lib so it's client-reachable (RPC stub in the
 * browser bundle; body stripped by the server-fn transform).
 */
export type LoadedSessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles: ("super_admin" | "staff" | "customer")[];
  isSuperAdmin: boolean;
} | null;

import { getCookie } from "@tanstack/react-start/server";

export const loadSessionFn = createServerFn({ method: "GET" }).handler(async (): Promise<LoadedSessionUser> => {
  const token = getCookie("giftty_session");
  const { authService } = await import("@/server/services/auth.service");
  return authService.me(token);
});
