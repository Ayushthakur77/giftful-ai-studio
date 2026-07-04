import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Star, LocateFixed } from "lucide-react";

import {
  createAddressFn, deleteAddressFn, listAddressesFn, reverseGeocodeFn,
  setDefaultAddressFn, updateAddressFn,
} from "@/lib/address.functions";
import { getCurrentPosition } from "@/lib/geolocation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/account/addresses")({
  head: () => ({ meta: [{ title: "Address book — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: AddressBookPage,
});

type Address = Awaited<ReturnType<typeof listAddressesFn>>[number];

const empty = { label: "", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "IN", isDefault: false };

function AddressBookPage() {
  const qc = useQueryClient();
  const { data: addresses = [] } = useQuery({ queryKey: ["addresses"], queryFn: () => listAddressesFn() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (a: Address) => { setEditing(a); setOpen(true); };

  const remove = useMutation({
    mutationFn: (id: string) => deleteAddressFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); toast.success("Address removed"); },
  });
  const setDefault = useMutation({
    mutationFn: (id: string) => setDefaultAddressFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); toast.success("Default updated"); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Address book</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage where we deliver your gifts.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1.5 size-4" /> Add address</Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses saved" description="Add a delivery address for faster checkout." action={<Button onClick={openNew}><Plus className="mr-1.5 size-4" /> Add address</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.fullName}</p>
                    {a.label && <Badge variant="secondary">{a.label}</Badge>}
                    {a.isDefault && <Badge className="bg-primary text-primary-foreground">Default</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.phone}</p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                    {a.city}, {a.state} {a.pincode}<br />
                    {a.country}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!a.isDefault && (
                  <Button size="sm" variant="outline" onClick={() => setDefault.mutate(a.id)}>
                    <Star className="mr-1.5 size-3.5" /> Set default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="mr-1.5 size-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(a.id)}><Trash2 className="mr-1.5 size-3.5" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressDialog open={open} onOpenChange={setOpen} initial={editing ? { ...editing, label: editing.label ?? "", line2: editing.line2 ?? "" } : empty} editingId={editing?.id} />
    </div>
  );
}

function AddressDialog({
  open, onOpenChange, initial, editingId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: typeof empty;
  editingId?: string;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(initial);
  const [locating, setLocating] = useState(false);

  // Reset form when dialog opens with new initial
  useState(() => { setForm(initial); });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => createAddressFn({ data: {
      label: form.label || null, fullName: form.fullName, phone: form.phone,
      line1: form.line1, line2: form.line2 || null, city: form.city, state: form.state,
      pincode: form.pincode, country: form.country || "IN", isDefault: form.isDefault,
    } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added");
      onOpenChange(false);
    },
  });

  const update = useMutation({
    mutationFn: () => updateAddressFn({ data: {
      id: editingId!, label: form.label || null, fullName: form.fullName, phone: form.phone,
      line1: form.line1, line2: form.line2 || null, city: form.city, state: form.state,
      pincode: form.pincode, country: form.country || "IN", isDefault: form.isDefault,
    } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated");
      onOpenChange(false);
    },
  });

  async function detectLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      if (!pos) { toast.error("Location permission denied"); return; }
      const res = await reverseGeocodeFn({ data: pos });
      if (!res.ok) { toast.error("Couldn't detect address"); return; }
      setForm((f) => ({ ...f, city: res.city || f.city, state: res.state || f.state, pincode: res.pincode || f.pincode, country: res.country || f.country }));
      toast.success("Location detected");
    } finally { setLocating(false); }
  }

  const isEditing = !!editingId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit address" : "Add new address"}</DialogTitle>
          <DialogDescription>Save this address for faster checkout.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => { e.preventDefault(); (isEditing ? update : create).mutate(); }}
        >
          <div>
            <Label htmlFor="ad-full">Full name</Label>
            <Input id="ad-full" required className="mt-1 h-11" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-phone">Phone</Label>
            <Input id="ad-phone" required className="mt-1 h-11" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-line1">House / Flat / Building</Label>
            <Input id="ad-line1" required className="mt-1 h-11" value={form.line1} onChange={(e) => set("line1", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-line2">Street / Area (optional)</Label>
            <Input id="ad-line2" className="mt-1 h-11" value={form.line2} onChange={(e) => set("line2", e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Tip: detect your location to prefill.</p>
            <Button type="button" size="sm" variant="outline" onClick={detectLocation} disabled={locating}>
              <LocateFixed className="mr-1.5 size-3.5" /> {locating ? "Detecting…" : "Use my location"}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ad-city">City</Label>
              <Input id="ad-city" required className="mt-1 h-11" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ad-state">State</Label>
              <Input id="ad-state" required className="mt-1 h-11" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ad-pin">PIN code</Label>
              <Input id="ad-pin" required inputMode="numeric" pattern="\d{6}" maxLength={6} className="mt-1 h-11" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ad-country">Country</Label>
              <Input id="ad-country" required maxLength={2} className="mt-1 h-11 uppercase" value={form.country} onChange={(e) => set("country", e.target.value.toUpperCase())} />
            </div>
          </div>
          <div>
            <Label htmlFor="ad-label">Label (Home, Work…)</Label>
            <Input id="ad-label" className="mt-1 h-11" value={form.label} onChange={(e) => set("label", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.isDefault} onCheckedChange={(v) => set("isDefault", !!v)} />
            Make this my default address
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEditing ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
