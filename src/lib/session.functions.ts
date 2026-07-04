import { supabase } from "@/integrations/supabase/client";

export type LoadedSessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles: ("super_admin" | "staff" | "customer")[];
  isSuperAdmin: boolean;
} | null;

/**
 * Client-side session loader. Reads the Supabase session from localStorage
 * via the browser client. On the server (SSR) there is no session storage,
 * so this returns null and the client re-hydrates after mount.
 */
export async function loadSessionFn(): Promise<LoadedSessionUser> {
  if (typeof window === "undefined") return null;
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const superAdminEmail = (import.meta.env.VITE_SUPER_ADMIN_EMAIL as string | undefined) ?? "";
    const isSuperAdmin =
      !!superAdminEmail && user.email?.toLowerCase() === superAdminEmail.toLowerCase();
    return {
      id: user.id,
      email: user.email ?? "",
      name: (meta.full_name as string) ?? (meta.name as string) ?? null,
      avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
      roles: isSuperAdmin ? ["super_admin"] : ["customer"],
      isSuperAdmin,
    };
  } catch (err) {
    console.error("loadSessionFn failed:", err);
    return null;
  }
}
