import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "../db/client";
import { notifications } from "../db/schema";

export const notificationService = {
  async list(userId: string, limit = 20) {
    return db()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  },

  async unreadCount(userId: string) {
    const [row] = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return row?.n ?? 0;
  },

  async markRead(userId: string, id: string) {
    await db()
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  },

  async markAllRead(userId: string) {
    await db()
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  },

  async create(userId: string, kind: string, title: string, body?: string) {
    const [row] = await db()
      .insert(notifications)
      .values({ userId, kind, title, body })
      .returning();
    return row;
  },
};
