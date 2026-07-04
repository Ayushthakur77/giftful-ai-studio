import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceBlock } from "@/components/product/price-block";
import { aiSearchFn } from "@/lib/ai.functions";

type Result = { slug: string; name: string; image: string; pricePaise: number; mrpPaise?: number; reason: string };

export function AiSearchPanel({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [asked, setAsked] = useState(false);

  async function run() {
    if (q.trim().length < 2) return;
    setLoading(true);
    setAsked(true);
    try {
      const res = await aiSearchFn({ data: { q: q.trim() } });
      if (!res.ok) { toast.error(res.error); setResults([]); setInterpretation(""); return; }
      setInterpretation(res.interpretation);
      setResults(res.results);
    } catch {
      toast.error("AI search unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">AI Search</span>
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder='Try "luxury gifts for mom under 3000"'
        />
        <Button onClick={run} disabled={loading || q.trim().length < 2}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Ask AI"}
        </Button>
      </div>

      {interpretation && <p className="mt-3 text-xs text-muted-foreground">✨ {interpretation}</p>}

      {asked && !loading && results.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">No AI matches — try a broader query.</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {results.map((r) => (
            <Link
              key={r.slug}
              to="/p/$slug"
              params={{ slug: r.slug }}
              className="group rounded-md border border-border bg-card p-2 hover:shadow-md"
            >
              <img src={r.image} alt={r.name} className="aspect-square w-full rounded-md object-cover" />
              <h3 className="mt-2 line-clamp-2 text-sm font-medium">{r.name}</h3>
              <PriceBlock pricePaise={r.pricePaise} mrpPaise={r.mrpPaise} size="sm" className="mt-1" />
              {r.reason && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">✨ {r.reason}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
