import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle, LogOut } from "lucide-react";
import { adminListCustomersFn, adminGetCustomerFn, adminToggleCustomerBanFn } from "@/lib/admin-ops.functions";
import { adminForceLogoutFn } from "@/lib/admin-system.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

function AdminCustomers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: customers = [] } = useQuery({ queryKey: ["admin-customers", q], queryFn: () => adminListCustomersFn({ data: { q: q || undefined } }) });
  const { data: detail } = useQuery({ queryKey: ["admin-customer", openId], queryFn: () => adminGetCustomerFn({ data: { id: openId! } }), enabled: !!openId });

  const ban = useMutation({ mutationFn: (input: { id: string; ban: boolean }) => adminToggleCustomerBanFn({ data: input }), onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-customers"] }); } });
  const forceLogout = useMutation({ mutationFn: (userId: string) => adminForceLogoutFn({ data: { userId } }), onSuccess: () => toast.success("Signed out") });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold">Customers ({customers.length})</h1>
        <Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th>
              <th className="p-2 text-right">Orders</th><th className="p-2 text-right">Spent</th>
              <th className="p-2 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No customers.</td></tr> :
              customers.map((c: any) => (
                <tr key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setOpenId(c.id)}>
                  <td className="p-2 font-medium">{c.name ?? "—"}</td>
                  <td className="p-2">{c.email ?? "—"}</td>
                  <td className="p-2 text-right">{c.orders_count}</td>
                  <td className="p-2 text-right tabular-nums">{formatINR(c.total_spent_paise)}</td>
                  <td className="p-2 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Customer profile</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Badge variant="outline">Name</Badge> <span className="ml-1 font-medium">{detail.profile?.name ?? "—"}</span></div>
                <div><Badge variant="outline">Email</Badge> <span className="ml-1">{detail.email ?? "—"}</span></div>
                <div><Badge variant="outline">Last sign-in</Badge> <span className="ml-1">{detail.last_sign_in_at ? new Date(detail.last_sign_in_at).toLocaleString() : "—"}</span></div>
                <div><Badge variant="outline">Addresses</Badge> <span className="ml-1">{detail.addresses.length}</span></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => ban.mutate({ id: openId!, ban: true })}><Ban className="size-4 mr-1.5" /> Ban</Button>
                <Button size="sm" variant="outline" onClick={() => ban.mutate({ id: openId!, ban: false })}><CheckCircle className="size-4 mr-1.5" /> Unban</Button>
                <Button size="sm" variant="outline" onClick={() => forceLogout.mutate(openId!)}><LogOut className="size-4 mr-1.5" /> Force logout</Button>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Orders ({detail.orders.length})</h3>
                <div className="divide-y divide-border rounded border border-border">
                  {detail.orders.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No orders.</p> :
                    detail.orders.map((o: any) => (
                      <div key={o.id} className="p-2 text-sm flex justify-between">
                        <span className="font-mono text-xs">{o.order_number}</span>
                        <Badge variant="outline">{o.status}</Badge>
                        <span className="tabular-nums">{formatINR(o.grand_total_paise)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
