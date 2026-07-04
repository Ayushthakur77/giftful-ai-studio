import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Send, Loader2, PackageOpen, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductCard } from "@/components/product/product-card";
import { aiRecommendFn } from "@/lib/ai.functions";
import { findProductBySlug, findReadyBoxBySlug, formatINR } from "@/lib/catalog";
import { useCart } from "@/lib/store";

type Result = Awaited<ReturnType<typeof aiRecommendFn>>;

const EXAMPLES = [
  "Birthday gift for my wife under ₹2000",
  "Anniversary hamper for parents",
  "Something for a colleague who loves coffee",
  "Rakhi gift for my brother",
];

export function AiAssistant() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const addReady = useCart((s) => s.addReadyBox);

  async function ask(text?: string) {
    const q = (text ?? query).trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    try {
      const budgetPaise = budget ? Math.max(0, Math.floor(Number(budget) * 100)) : undefined;
      const res = await aiRecommendFn({ data: { query: q, budgetPaise: Number.isFinite(budgetPaise) ? budgetPaise : undefined } });
      setResult(res);
      if (!res.ok) toast.error(res.error);
    } catch {
      toast.error("The AI is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">AI Gift Finder</span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">Not sure what to gift?</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Tell us about them in your own words. Our AI recommends products, ready-made boxes, and even
          builds a custom gift box — you stay in control and can edit everything before checkout.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
          <Label htmlFor="ai-query" className="text-sm font-medium">Describe the recipient or occasion</Label>
          <Textarea
            id="ai-query"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. My mom's 60th birthday, she loves gardening and chai"
            className="mt-2"
          />
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="ai-budget" className="text-xs">Budget (₹)</Label>
              <Input
                id="ai-budget"
                type="number"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 2000"
              />
            </div>
            <div className="col-span-2 md:col-span-2 md:self-end">
              <Button onClick={() => ask()} disabled={loading || !query.trim()} className="h-11 w-full">
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                {loading ? "Thinking…" : "Ask AI"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); ask(ex); }}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Our AI is picking gifts for you…
          </div>
        )}

        {result && result.ok && (
          <div className="mt-8 space-y-8">
            {result.note && (
              <blockquote className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm italic">
                “{result.note}”
              </blockquote>
            )}

            {result.products.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-xl font-bold">Recommended products</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.products.map((r) => {
                    const p = findProductBySlug(r.slug);
                    if (!p) return null;
                    return (
                      <div key={r.slug}>
                        <ProductCard product={p} />
                        {r.reason && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">✨ {r.reason}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {result.readyBoxes.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-xl font-bold">Ready-made gift boxes</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.readyBoxes.map((r) => {
                    const b = findReadyBoxBySlug(r.slug);
                    if (!b) return null;
                    return (
                      <div key={r.slug} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                        <img src={b.image} alt={b.name} className="size-24 shrink-0 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold">{b.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.reason || b.description}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-bold price-num">{formatINR(b.pricePaise)}</span>
                            <Button size="sm" onClick={() => { addReady(b.slug); toast.success("Added to cart"); }}>
                              Add to cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {result.buildBoxSuggested && (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <PackageOpen className="mt-0.5 size-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Or let AI build a custom gift box</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A one-of-a-kind box tailored to your description. You can add, remove, or replace items before checkout.
                    </p>
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/gift-box" search={{ ai: query, budget: budget || undefined } as never}>
                        <Gift className="mr-1 size-4" /> Build my gift box
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {result.products.length === 0 && result.readyBoxes.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                We couldn't find a perfect match this time. Try widening the budget or describing the recipient differently.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
