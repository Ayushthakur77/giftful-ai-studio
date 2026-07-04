import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListCouponsFn, adminUpsertCouponFn, adminDeleteCouponFn } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/coupons")({ component: AdminCoupons });

type Form = {
  id?: string;
  code: string;
  description: string;
  discount_type: "flat" | "percent" | "free_shipping";
  discount_value: number;
  max_discount_paise: number | null;
  min_order_paise: number;
  first_order_only: boolean;
  per_user_limit: number;
  total_usage_limit: number;
  active: boolean;
};

const empty: Form = {
  code: "", description: "", discount_type: "flat", discount_value: 0,
  max_discount_paise: null, min_order_paise: 0, first_order_only: false,
  per_user_limit: 0, total_usage_limit: 0, active: true,
};

function AdminCoupons() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"], queryFn: () => adminListCouponsFn(),
  });

  const save = useMutation({
    mutationFn: () => adminUpsertCouponFn({ data: form as any }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Coupon saved"); setOpen(false); setForm(empty);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCouponFn({ data: { id } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  function edit(c: any) {
    setForm({
      id: c.id, code: c.code, description: c.description ?? "",
      discount_type: c.discount_type, discount_value: c.discount_value,
      max_discount_paise: c.max_discount_paise, min_order_paise: c.min_order_paise,
      first_order_only: c.first_order_only, per_user_limit: c.per_user_limit,
      total_usage_limit: c.total_usage_limit, active: c.active,
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Coupons</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 size-4" /> New coupon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit coupon" : "New coupon"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                       placeholder="WELCOME100" /></div>
              <div><Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat ₹ off</SelectItem>
                      <SelectItem value="percent">Percent %</SelectItem>
                      <SelectItem value="free_shipping">Free shipping</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label>{form.discount_type === "percent" ? "Percent (0-100)" : form.discount_type === "flat" ? "Amount (paise)" : "Value (ignored)"}</Label>
                  <Input type="number" value={form.discount_value}
                         onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value || "0", 10) })} /></div>
              </div>
              {form.discount_type === "percent" && (
                <div><Label>Max discount cap (paise, optional)</Label>
                  <Input type="number" value={form.max_discount_paise ?? ""}
                         onChange={(e) => setForm({ ...form, max_discount_paise: e.target.value ? parseInt(e.target.value, 10) : null })} /></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Min order (paise)</Label>
                  <Input type="number" value={form.min_order_paise}
                         onChange={(e) => setForm({ ...form, min_order_paise: parseInt(e.target.value || "0", 10) })} /></div>
                <div><Label>Per-user limit (0 = ∞)</Label>
                  <Input type="number" value={form.per_user_limit}
                         onChange={(e) => setForm({ ...form, per_user_limit: parseInt(e.target.value || "0", 10) })} /></div>
                <div><Label>Total usage limit (0 = ∞)</Label>
                  <Input type="number" value={form.total_usage_limit}
                         onChange={(e) => setForm({ ...form, total_usage_limit: parseInt(e.target.value || "0", 10) })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.first_order_only}
                        onCheckedChange={(v) => setForm({ ...form, first_order_only: v })} />
                First-order only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                Active
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !form.code}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 rounded-md border border-border bg-card">
        {coupons.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No coupons yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {coupons.map((c: any) => (
              <div key={c.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{c.code}</span>
                    {c.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    <Badge variant="outline" className="capitalize">{c.discount_type.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {c.description ?? "—"} · used {c.usage_count}x
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => edit(c)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
