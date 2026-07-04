import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListAuditLogsFn } from "@/lib/admin-system.functions";

export const Route = createFileRoute("/admin/audit-logs")({ component: AdminAuditLogs });

function AdminAuditLogs() {
  const { data: logs = [] } = useQuery({ queryKey: ["admin-audit-logs"], queryFn: () => adminListAuditLogsFn() });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Audit logs ({logs.length})</h1>
      <p className="text-sm text-muted-foreground">Every admin action is recorded here. Append-only — cannot be edited or deleted.</p>
      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Actor</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Entity</th>
              <th className="p-2 text-left">Entity ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No admin actions logged yet.</td></tr> :
              logs.map((l: any) => (
                <tr key={l.id}>
                  <td className="p-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-2 font-mono text-xs">{l.actor_email ?? l.actor_id?.slice(0, 8) ?? "—"}</td>
                  <td className="p-2 font-mono">{l.action}</td>
                  <td className="p-2 text-muted-foreground">{l.entity}</td>
                  <td className="p-2 font-mono text-xs">{l.entity_id?.slice(0, 12) ?? "—"}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
