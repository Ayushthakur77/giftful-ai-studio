import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SESSION_COOKIE = "giftty_session";

async function serverUtils() {
  return await import("@tanstack/react-start/server");
}

async function requireUserId(): Promise<string> {
  const { getCookie } = await serverUtils();
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  const me = await authService.me(token);
  if (!me) throw new Response("Unauthorized", { status: 401 });
  return me.id;
}

export const getProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const { profileService } = await import("@/server/services/profile.service");
  const [profile, stats] = await Promise.all([profileService.get(userId), profileService.stats(userId)]);
  return { profile, stats };
});

const updateInput = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  avatarUrl: z.string().trim().max(2048).optional().or(z.literal("")),
});

export const updateProfileFn = createServerFn({ method: "POST" })
  .inputValidator((d) => updateInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const { profileService } = await import("@/server/services/profile.service");
    try {
      await profileService.update(userId, data);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Update failed" };
    }
  });

export const listSessionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await serverUtils();
  const token = getCookie(SESSION_COOKIE);
  const userId = await requireUserId();
  const { profileService } = await import("@/server/services/profile.service");
  return profileService.listSessions(userId, token ?? null);
});

export const signOutOthersFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getCookie } = await serverUtils();
  const token = getCookie(SESSION_COOKIE);
  const userId = await requireUserId();
  const { profileService } = await import("@/server/services/profile.service");
  return profileService.signOutOthers(userId, token ?? null);
});

export const deleteAccountFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ confirm: z.literal("DELETE") }).parse(d))
  .handler(async () => {
    const userId = await requireUserId();
    const { profileService } = await import("@/server/services/profile.service");
    const { deleteCookie } = await serverUtils();
    await profileService.deleteAccount(userId);
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true as const };
  });
