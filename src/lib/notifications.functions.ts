import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SESSION_COOKIE = "giftty_session";

async function requireUserId(): Promise<string> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  const me = await authService.me(token);
  if (!me) throw new Response("Unauthorized", { status: 401 });
  return me.id;
}

export const listNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const { notificationService } = await import("@/server/services/notification.service");
  const [items, unread] = await Promise.all([
    notificationService.list(userId, 20),
    notificationService.unreadCount(userId),
  ]);
  return { items, unread };
});

export const unreadNotificationsCountFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(SESSION_COOKIE);
  const { authService } = await import("@/server/services/auth.service");
  const me = await authService.me(token);
  if (!me) return { count: 0 };
  const { notificationService } = await import("@/server/services/notification.service");
  return { count: await notificationService.unreadCount(me.id) };
});

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const { notificationService } = await import("@/server/services/notification.service");
    await notificationService.markRead(userId, data.id);
    return { ok: true as const };
  });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await requireUserId();
  const { notificationService } = await import("@/server/services/notification.service");
  await notificationService.markAllRead(userId);
  return { ok: true as const };
});
