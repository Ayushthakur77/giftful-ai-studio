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
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie("giftty_session");
  const { authService } = await import("@/server/services/auth.service");
  return authService.me(token);
});
