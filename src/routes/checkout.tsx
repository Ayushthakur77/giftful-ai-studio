import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin, Plus, ShoppingBag, Truck, CheckCircle2, Wallet, ChevronRight, Info, LocateFixed, Loader2,
} from "lucide-react";

import { useCart } from "@/lib/store";
import { computeCartTotalsFn } from "@/lib/catalog.functions";
import { computeCart, type CartTotals } from "@/lib/pricing";
import { formatINR } from "@/lib/catalog";
import { listAddressesFn, createAddressFn, type Address } from "@/lib/address.functions";
import { placeCodOrderFn } from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
    }
  },
  head: () => ({ meta: [{ title: "Checkout — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const clearCart = useCart((s) => s.clear);

  // Empty cart guard
  useEffect(() => {
    if (hydrated && lines.length === 0) navigate({ to: "/cart" });
  }, [hydrated, lines.length, navigate]);

  // Server-authoritative totals
  const clientTotals = useMemo(() => computeCart(lines), [lines]);
  const [serverTotals, setServerTotals] = useState<CartTotals | null>(null);
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    let cancelled = false;
    computeCartTotalsFn({ data: { lines } })
      .then((t) => { if (!cancelled) setServerTotals(t as CartTotals); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hydrated, JSON.stringify(lines)]);
  const totals = serverTotals ?? clientTotals;

  // Addresses
  const { data: addresses = [] } = useQuery({ queryKey: ["addresses"], queryFn: () => listAddressesFn() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && addresses.length > 0) {
      setSelectedId(addresses.find((a) => a.isDefault)?.id ?? addresses[0].id);
    }
  }, [addresses, selectedId]);

  // Payment method — MVP: COD only, Razorpay coming
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [notes, setNotes] = useState("");

  const place = useMutation({
    mutationFn: () => placeCodOrderFn({ data: {
      addressId: selectedId!,
      lines,
      notes: notes.trim() || undefined,
    } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      clearCart();
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(`Order ${res.orderNumber} placed!`);
      navigate({ to: "/account/orders/$id", params: { id: res.orderId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to place order"),
  });

  if (!hydrated) {
    return <div className="container-page py-12"><p className="text-sm text-muted-foreground">Loading checkout…</p></div>;
  }

  const canPlace = !!selectedId && totals.errors.length === 0 && lines.length > 0 && !place.isPending;

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/cart" className="hover:text-foreground">Cart</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Checkout</span>
      </div>

      <h1 className="font-display text-2xl font-bold md:text-3xl">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Address step */}
          <section className="rounded-md border border-border bg-card p-5">
            <StepHeader n={1} icon={MapPin} title="Delivery address" />
            {addresses.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">You haven't saved any addresses yet.</p>
                <div className="mt-3 flex justify-center">
                  <AddressQuickAdd onCreated={(a) => setSelectedId(a.id)} />
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition",
                      selectedId === a.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-primary"
                      checked={selectedId === a.id}
                      onChange={() => setSelectedId(a.id)}
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{a.fullName}</span>
                        {a.label && <Badge variant="secondary">{a.label}</Badge>}
                        {a.isDefault && <Badge className="bg-primary text-primary-foreground">Default</Badge>}
                      </div>
                      <p className="text-muted-foreground">{a.phone}</p>
                      <p className="mt-1 leading-relaxed">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode} · {a.country}
                      </p>
                    </div>
                  </label>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  <AddressQuickAdd onCreated={(a) => setSelectedId(a.id)} />
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/account/addresses">Manage addresses</Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Delivery step */}
          <section className="rounded-md border border-border bg-card p-5">
            <StepHeader n={2} icon={Truck} title="Delivery method" />
            <div className="mt-4 rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Standard delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Estimated in 3–5 business days
                  </p>
                </div>
                <p className="text-sm font-semibold price-num">
                  {totals.shippingPaise === 0 ? "Free" : formatINR(totals.shippingPaise)}
                </p>
              </div>
            </div>
          </section>

          {/* Payment step */}
          <section className="rounded-md border border-border bg-card p-5">
            <StepHeader n={3} icon={Wallet} title="Payment method" />
            <div className="mt-4 space-y-2">
              <label className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition",
                paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
              )}>
                <input type="radio" className="mt-1 accent-primary"
                  checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay in cash when your order arrives.</p>
                </div>
              </label>
              <label className={cn(
                "flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 opacity-60",
              )}>
                <input type="radio" disabled className="mt-1 accent-primary" checked={false} readOnly />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Razorpay <Badge variant="secondary" className="ml-1">Coming soon</Badge></p>
                  <p className="text-xs text-muted-foreground">UPI, cards, net banking & wallets.</p>
                </div>
              </label>
            </div>

            <div className="mt-4">
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Input id="notes" className="mt-1 h-11" placeholder="E.g. leave with security"
                value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ShoppingBag className="size-4" /> Order summary
          </h2>

          <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
            {totals.lines.map((l) => (
              <li key={l.id} className="flex gap-2.5 text-sm">
                <img src={l.image} alt="" className="size-12 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {l.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold price-num">{formatINR(l.lineSubtotalPaise)}</p>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          <dl className="grid gap-2 text-sm price-num">
            <Row label="Subtotal" value={formatINR(totals.subtotalPaise)} />
            <Row label="GST (18%)" value={formatINR(totals.taxPaise)} />
            <Row
              label="Shipping"
              value={totals.shippingPaise === 0 ? "Free" : formatINR(totals.shippingPaise)}
              hint={
                totals.shippingPaise === 0
                  ? undefined
                  : `Add ${formatINR(totals.free_shipping_threshold_paise - totals.subtotalPaise)} more for free shipping`
              }
            />
          </dl>

          <Separator className="my-4" />

          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold">Grand total</span>
            <span className="text-xl font-bold price-num">{formatINR(totals.grandTotalPaise)}</span>
          </div>

          {totals.errors.length > 0 && (
            <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="mb-1 font-semibold">Please fix these before placing your order:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {totals.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <Button
            size="lg"
            className="mt-4 h-11 w-full"
            disabled={!canPlace}
            onClick={() => place.mutate()}
          >
            {place.isPending ? "Placing order…" : (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Place order · {formatINR(totals.grandTotalPaise)}
              </>
            )}
          </Button>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            By placing your order you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy policy</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}

function StepHeader({ n, icon: Icon, title }: { n: number; icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {n}
      </div>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AddressQuickAdd({ onCreated }: { onCreated: (a: Address) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "", phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "", country: "IN",
    label: "", isDefault: false,
  });
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => createAddressFn({ data: {
      label: form.label || null,
      fullName: form.fullName, phone: form.phone,
      line1: form.line1, line2: form.line2 || null,
      city: form.city, state: form.state,
      pincode: form.pincode, country: form.country || "IN",
      isDefault: form.isDefault,
    } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address saved");
      onCreated(res.address);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 size-4" /> Add new address</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Add delivery address</DialogTitle></DialogHeader>
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <UseMyLocationButton
            onResolved={(loc) => setForm((f) => ({
              ...f,
              line1: f.line1 || loc.line1 || "",
              line2: f.line2 || loc.line2 || "",
              city: loc.city || f.city,
              state: loc.state || f.state,
              pincode: loc.pincode || f.pincode,
              country: loc.country || f.country || "IN",
            }))}
          />
          <Field label="Full name" value={form.fullName} onChange={(v) => set("fullName", v)} required />
          <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} required />
          <Field label="House / Flat / Building" value={form.line1} onChange={(v) => set("line1", v)} required />
          <Field label="Street / Area (optional)" value={form.line2} onChange={(v) => set("line2", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} required />
            <Field label="State" value={form.state} onChange={(v) => set("state", v)} required />
            <Field label="PIN code" value={form.pincode} onChange={(v) => set("pincode", v)} required
                   inputProps={{ inputMode: "numeric", pattern: "\\d{6}", maxLength: 6 }} />
            <Field label="Country" value={form.country}
                   onChange={(v) => set("country", v.toUpperCase())} required
                   inputProps={{ maxLength: 2, className: "uppercase" }} />
          </div>
          <Field label="Label (Home, Work…)" value={form.label} onChange={(v) => set("label", v)} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.isDefault} onCheckedChange={(v) => set("isDefault", !!v)} />
            Make this my default address
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Save address</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, value, onChange, required, inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-1 h-11"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
    </div>
  );
}
