import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListLoginHistoryFn } from "@/lib/admin-system.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/security")({ component: AdminSecurity });

function AdminSecurity() {
  const { data: history = [] } = useQuery({ queryKey: ["admin-login-history"], queryFn: () => adminListLoginHistoryFn() });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Security center</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="font-semibold mb-2">Login history ({history.length})</h2>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">No admin login events recorded yet.</p> :
            <ul className="text-sm space-y-1">
              {history.map((h: any) => (
                <li key={h.id} className="flex justify-between">
                  <span>{h.email ?? h.user_id?.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                  <Badge variant={h.success ? "default" : "destructive"}>{h.success ? "OK" : "Fail"}</Badge>
                </li>
              ))}
            </ul>
          }
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="font-semibold mb-2">Account controls</h2>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Password reset — use the sign-in page "Forgot password" link.</li>
            <li>• 2FA — coming soon.</li>
            <li>• API/rate-limit events — logged in audit logs.</li>
            <li>• Force logout of users — from customer profile in Customers page.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
