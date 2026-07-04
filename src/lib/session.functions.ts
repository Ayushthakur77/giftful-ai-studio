import { createServerFn } from "@tanstack/react-start";

export type LoadedSessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles: ("super_admin" | "staff" | "customer")[];
  isSuperAdmin: boolean;
} | null;

export const loadSessionFn = createServerFn({ method: "GET" }).handler(async (): Promise<LoadedSessionUser> => {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    const token = getCookie("giftty_session");
    if (!token) return null;
    const { authService } = await import("@/server/services/auth.service");
    return await authService.me(token);
  } catch (err) {
    // Never let a transient DB/cookie error take down the app shell.
    console.error("loadSessionFn failed:", err);
    return null;
  }
});
