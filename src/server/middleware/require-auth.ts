import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import { SESSION_COOKIE, getSessionUser, type SessionUser } from "../lib/session";

/**
 * Attach the current SessionUser to server-fn context. Throws 401 when
 * called by an unauthenticated user.
 */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = getCookie(SESSION_COOKIE);
  const user = await getSessionUser(token);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return next({ context: { user } as { user: SessionUser } });
});

/**
 * Attach SessionUser when present, null otherwise. Never throws.
 */
export const withOptionalAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = getCookie(SESSION_COOKIE);
  const user = await getSessionUser(token);
  return next({ context: { user } as { user: SessionUser | null } });
});
