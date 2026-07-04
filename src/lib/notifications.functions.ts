import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: string;
  readAt: string | null;
};

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: NotificationItem[]; unread: number }> => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return { items: [], unread: 0 };
    const items = (data ?? []).map((n: any) => ({
      id: n.id, type: n.type, title: n.title, body: n.body, link: n.link,
      createdAt: n.created_at, readAt: n.is_read ? n.created_at : null,
    }));
    const unread = items.filter((i) => !i.readAt).length;
    return { items, unread };
  });

export const unreadNotificationsCountFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    return { count: count ?? 0 };
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("notifications").update({ is_read: true }).eq("id", data.id);
    return { ok: true as const };
  });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    return { ok: true as const };
  });

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("notifications").delete().eq("id", data.id);
    return { ok: true as const };
  });
