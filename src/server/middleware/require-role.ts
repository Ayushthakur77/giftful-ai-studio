import { createMiddleware } from "@tanstack/react-start";

import { db } from "../db/client";
import { auditLogs } from "../db/schema";
import { requireAuth } from "./require-auth";

/**
 * Require the caller to hold `role`. On rejection, writes an audit log
 * (unauthorized_access) and throws 403.
 */
export function requireRole(role: "super_admin" | "staff") {
  return createMiddleware({ type: "function" })
    .middleware([requireAuth])
    .server(async ({ next, context }) => {
      if (!context.user.roles.includes(role)) {
        await db().insert(auditLogs).values({
          actorId: context.user.id,
          action: "authz.denied",
          entityType: "role",
          entityId: role,
        });
        throw new Response("Forbidden", { status: 403 });
      }
      return next();
    });
}

export const requireSuperAdmin = requireRole("super_admin");
