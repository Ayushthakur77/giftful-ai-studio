import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListDeliveryRulesFn, adminUpsertDeliveryRuleFn, adminDeleteDeliveryRuleFn } from "@/lib/admin-ops.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/delivery")({ component: AdminDelivery });

type F = {
  id?: string; state: string; pincode_prefix: string;
  base_charge_paise: number; free_shipping_threshold_paise: number;
  express_available: boolean; express_charge_paise: number;
  estimated_days_min: number; estimated_days_max: number;
  cod_available: boolean; active: boolean;
};
const empty: F = {
  state: "", pincode_prefix: "", base_charge_paise: 0, free_shipping_threshold_paise: 0,
  express_available: false, express_charge_paise: 0,
  estimated_days_min: 3, estimated_days_max: 7, cod_available: true, active: true,
};

function AdminDelivery() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const { data: rules = [] } = useQuery({ queryKey: ["admin-delivery"], queryFn: () => adminListDeliveryRulesFn() });
  const save = useMutation({
    mutationFn: () => adminUpsertDeliveryRuleFn({ data: { ...form, state: form.state || null, pincode_prefix: form.pincode_prefix || null } as never }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-delivery"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteDeliveryRuleFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-delivery"] }); },
  });
  function edit(r: any) { setForm({ ...r, state: r.state ?? "", pincode_prefix: r.pincode_prefix ?? "" }); setOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Delivery rules ({rules.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New rule</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} delivery rule</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Maharashtra" /></div>
                <div><Label>Pincode prefix</Label><Input value={form.pincode_prefix} onChange={(e) => setForm({ ...form, pincode_prefix: e.target.value })} placeholder="400" /></div>
                <div><Label>Base charge (paise)</Label><Input type="number" value={form.base_charge_paise} onChange={(e) => setForm({ ...form, base_charge_paise: +e.target.value })} /></div>
                <div><Label>Free ship threshold (paise)</Label><Input type="number" value={form.free_shipping_threshold_paise} onChange={(e) => setForm({ ...form, free_shipping_threshold_paise: +e.target.value })} /></div>
                <div><Label>Days min</Label><Input type="number" value={form.estimated_days_min} onChange={(e) => setForm({ ...form, estimated_days_min: +e.target.value })} /></div>
                <div><Label>Days max</Label><Input type="number" value={form.estimated_days_max} onChange={(e) => setForm({ ...form, estimated_days_max: +e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.express_available} onCheckedChange={(v) => setForm({ ...form, express_available: v })} /> Express available</label>
              {form.express_available && <div><Label>Express charge (paise)</Label><Input type="number" value={form.express_charge_paise} onChange={(e) => setForm({ ...form, express_charge_paise: +e.target.value })} /></div>}
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.cod_available} onCheckedChange={(v) => setForm({ ...form, cod_available: v })} /> COD available</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Active</label>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {rules.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No delivery rules. Add one to enable shipping.</p> :
          rules.map((r: any) => (
            <div key={r.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.state ?? "All states"} {r.pincode_prefix && <span className="text-xs text-muted-foreground">· {r.pincode_prefix}xxx</span>}</span>
                  {!r.active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Base {formatINR(r.base_charge_paise)} · Free above {formatINR(r.free_shipping_threshold_paise)} · {r.estimated_days_min}–{r.estimated_days_max} days · COD {r.cod_available ? "yes" : "no"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => edit(r)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
