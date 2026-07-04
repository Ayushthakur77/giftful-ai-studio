import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PriceBlock } from "@/components/product/price-block";
import { AiGiftBuilderPanel, type AiBuildDraft } from "@/components/ai/ai-gift-builder-panel";
import { AiGreetingButton } from "@/components/ai/ai-greeting-button";
import { cn } from "@/lib/utils";
import {
  emptyGiftBoxes,
  ribbons,
  fillers,
  greetingCards,
  products as allProducts,
  formatINR,
  findEmptyBoxBySlug,
  findProductBySlug,
  type Product,
} from "@/lib/catalog";
import { computeCart } from "@/lib/pricing";
import { useCart } from "@/lib/store";

export const Route = createFileRoute("/gift-box")({
  validateSearch: z.object({
    ai: z.string().max(500).optional(),
    budget: z.string().max(20).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Build Your Own Gift Box — Giftty" },
      { name: "description", content: "Design a custom gift box in 6 easy steps, or let AI build one for you — with full editing control." },
      { property: "og:title", content: "Build Your Own Gift Box — Giftty" },
    ],
  }),
  component: GiftBoxWizard,
});

const STEPS = ["Box", "Products", "Ribbon", "Filler", "Card", "Note", "Summary"] as const;

type Item = { productSlug: string; quantity: number };

function GiftBoxWizard() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const addCustomBox = useCart((s) => s.addCustomBox);

  const [step, setStep] = useState(0);
  const [boxSlug, setBoxSlug] = useState<string | undefined>(emptyGiftBoxes[0]?.slug);
  const [items, setItems] = useState<Item[]>([]);
  const [ribbonSlug, setRibbonSlug] = useState(ribbons[0].slug);
  const [fillerSlug, setFillerSlug] = useState(fillers[0].slug);
  const [cardSlug, setCardSlug] = useState(greetingCards[0].slug);
  const [note, setNote] = useState("");

  function applyAiDraft(draft: AiBuildDraft) {
    setBoxSlug(draft.emptyBoxSlug);
    setItems(draft.items.map((i) => ({ productSlug: i.productSlug, quantity: i.quantity })));
    if (draft.ribbonSlug) setRibbonSlug(draft.ribbonSlug);
    if (draft.fillerSlug) setFillerSlug(draft.fillerSlug);
    if (draft.cardSlug) setCardSlug(draft.cardSlug);
    if (draft.giftNote) setNote(draft.giftNote);
    setStep(1);
  }

  const box = boxSlug ? findEmptyBoxBySlug(boxSlug) : undefined;
  const compatibleProducts = useMemo<Product[]>(() => allProducts.filter((p) => p.isGiftBoxCompatible), []);
  const totalSlots = items.reduce((s, i) => s + i.quantity, 0);
  const capacityUsed = box ? Math.min(100, (totalSlots / box.capacity) * 100) : 0;

  const priced = useMemo(() => {
    if (!box) return null;
    return computeCart([{
      kind: "custom-box", id: "preview", emptyBoxSlug: box.slug,
      items, ribbonSlug, fillerSlug, cardSlug, giftNote: note, quantity: 1,
    }]);
  }, [box, items, ribbonSlug, fillerSlug, cardSlug, note]);

  function addItem(slug: string) {
    if (!box) return;
    if (totalSlots >= box.capacity) { toast.error(`Box is full (${box.capacity} slots)`); return; }
    setItems((prev) => {
      const found = prev.find((i) => i.productSlug === slug);
      if (found) return prev.map((i) => i.productSlug === slug ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productSlug: slug, quantity: 1 }];
    });
  }
  function decItem(slug: string) {
    setItems((prev) => prev.flatMap((i) => {
      if (i.productSlug !== slug) return [i];
      if (i.quantity <= 1) return [];
      return [{ ...i, quantity: i.quantity - 1 }];
    }));
  }
  function removeItem(slug: string) {
    setItems((prev) => prev.filter((i) => i.productSlug !== slug));
  }

  const canGoNext = () => {
    if (step === 0) return !!boxSlug;
    if (step === 1) return items.length > 0;
    return true;
  };

  function handleAddToCart() {
    if (!box) return;
    const totals = computeCart([{
      kind: "custom-box", id: "final", emptyBoxSlug: box.slug,
      items, ribbonSlug, fillerSlug, cardSlug, giftNote: note, quantity: 1,
    }]);
    if (totals.errors.length > 0) { totals.errors.forEach((e) => toast.error(e)); return; }
    addCustomBox({ emptyBoxSlug: box.slug, items, ribbonSlug, fillerSlug, cardSlug, giftNote: note });
    toast.success("Custom gift box added to cart");
    navigate({ to: "/cart" });
  }

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Build your gift box</h1>
      <p className="mt-1 text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      <div className="mt-4">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <ol className="mt-3 hidden flex-wrap gap-2 md:flex">
          {STEPS.map((s, i) => (
            <li key={s} className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
              i === step ? "border-primary bg-primary/10 text-primary font-semibold" :
              i < step ? "border-success text-success" : "border-border text-muted-foreground",
            )}>
              {i < step ? <Check className="size-3" /> : <span>{i + 1}</span>}
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {step === 0 && (
            <StepChoice
              options={emptyGiftBoxes}
              value={boxSlug}
              onChange={setBoxSlug}
              render={(b) => (
                <>
                  <img src={b.image} alt="" className="aspect-video w-full rounded-md object-cover" />
                  <h3 className="mt-3 text-sm font-semibold">{b.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{b.description}</p>
                  <p className="mt-2 text-xs">Capacity: {b.capacity} slots · Max {b.maxWeightGrams}g</p>
                  <PriceBlock pricePaise={b.pricePaise} size="sm" className="mt-1" />
                </>
              )}
            />
          )}

          {step === 1 && box && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Slots used: {totalSlots} / {box.capacity}</p>
                <p className="text-xs text-muted-foreground">Only gift-box compatible products shown</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {compatibleProducts.map((p) => {
                  const inBox = items.find((i) => i.productSlug === p.slug);
                  return (
                    <div key={p.slug} className="rounded-md border border-border bg-card p-3">
                      <img src={p.image} alt={p.name} className="aspect-square w-full rounded-md object-cover" />
                      <h4 className="mt-2 line-clamp-2 text-sm font-medium">{p.name}</h4>
                      <PriceBlock pricePaise={p.pricePaise} size="sm" className="mt-1" />
                      {inBox ? (
                        <div className="mt-2 inline-flex w-full items-center justify-between rounded-md border border-border">
                          <Button variant="ghost" size="sm" onClick={() => decItem(p.slug)} className="h-8 w-8 rounded-r-none"><Minus className="size-3" /></Button>
                          <span className="text-sm font-semibold">{inBox.quantity}</span>
                          <Button variant="ghost" size="sm" onClick={() => addItem(p.slug)} className="h-8 w-8 rounded-l-none" disabled={totalSlots >= box.capacity}><Plus className="size-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => addItem(p.slug)} disabled={totalSlots >= box.capacity}>
                          <Plus className="mr-1 size-3" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <StepAddOn options={ribbons} value={ribbonSlug} onChange={setRibbonSlug} title="Choose a ribbon" />
          )}
          {step === 3 && (
            <StepAddOn options={fillers} value={fillerSlug} onChange={setFillerSlug} title="Choose a filler" />
          )}
          {step === 4 && (
            <StepAddOn options={greetingCards} value={cardSlug} onChange={setCardSlug} title="Choose a greeting card" />
          )}

          {step === 5 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Write a gift note</h3>
              <Textarea
                rows={5}
                maxLength={500}
                placeholder="A short heartfelt note — printed on your card."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">{note.length}/500</p>
            </div>
          )}

          {step === 6 && priced && (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Review your box</h3>
              <ul className="space-y-1 rounded-md border border-border bg-card p-4 text-sm">
                {priced.lines[0].details?.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
              {priced.errors.length > 0 && (
                <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  {priced.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="mr-1 size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canGoNext()}>
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={handleAddToCart} disabled={!priced || priced.errors.length > 0}>
                Add to cart
              </Button>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="h-fit rounded-md border border-border bg-card p-4 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your box</h2>
          {box && (
            <>
              <img src={box.image} alt="" className="mt-3 aspect-video w-full rounded-md object-cover" />
              <p className="mt-2 text-sm font-semibold">{box.name}</p>
              <div className="mt-2">
                <Progress value={capacityUsed} />
                <p className="mt-1 text-xs text-muted-foreground">{totalSlots} / {box.capacity} slots used</p>
              </div>
            </>
          )}
          <ul className="mt-3 space-y-1.5 text-sm">
            {items.map((i) => {
              const p = findProductBySlug(i.productSlug);
              if (!p) return null;
              return (
                <li key={i.productSlug} className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1">{i.quantity}× {p.name}</span>
                  <button aria-label="Remove" onClick={() => removeItem(i.productSlug)} className="text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                </li>
              );
            })}
            {items.length === 0 && <li className="text-xs text-muted-foreground">No products added yet.</li>}
          </ul>
          {priced && (
            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Box total</span>
                <span className="text-lg font-bold price-num">{formatINR(priced.lines[0].lineSubtotalPaise)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Shipping & tax added at checkout.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StepChoice<T extends { slug: string }>({
  options, value, onChange, render,
}: {
  options: T[];
  value: string | undefined;
  onChange: (v: string) => void;
  render: (t: T) => React.ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.slug}
          type="button"
          onClick={() => onChange(o.slug)}
          className={cn(
            "rounded-md border-2 p-3 text-left transition-colors",
            value === o.slug ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground",
          )}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

function StepAddOn({
  options, value, onChange, title,
}: {
  options: { slug: string; name: string; pricePaise: number }[];
  value: string;
  onChange: (v: string) => void;
  title: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2">
        {options.map((o) => (
          <div key={o.slug} className={cn(
            "flex items-center justify-between rounded-md border-2 p-3",
            value === o.slug ? "border-primary bg-primary/5" : "border-border",
          )}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={o.slug} id={`addon-${o.slug}`} />
              <Label htmlFor={`addon-${o.slug}`} className="cursor-pointer text-sm font-medium">{o.name}</Label>
            </div>
            <span className="text-sm price-num">{o.pricePaise === 0 ? "Free" : `+${formatINR(o.pricePaise)}`}</span>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
