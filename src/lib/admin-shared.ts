/**
 * Shared admin server helpers: super-admin middleware + audit logging.
 */
import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requireSuperAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) throw new Response("Forbidden", { status: 403 });
    return next();
  });

/** Append an audit log row (best-effort — never throws). */
export async function logAudit(params: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: unknown;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      diff: (params.diff ?? null) as never,
    });
  } catch {
    // swallow — audit failures must not break the admin action
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
