/**
 * Notifications API — placeholder until the notifications persistence
 * layer lands (dedicated phase). Shapes are stable so UI keeps working.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
};

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ items: Notification[]; unread: number }> => {
    return { items: [], unread: 0 };
  });

export const unreadNotificationsCountFn = createServerFn({ method: "GET" }).handler(async () => ({ count: 0 }));

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async () => ({ ok: true as const }));

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ ok: true as const }));
