import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { autocompleteProductsFn } from "@/lib/discovery.functions";
import { formatPricePaise } from "@/lib/pricing";

const RECENT_KEY = "giftty:recent-searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 6) : [];
  } catch { return []; }
}

function pushRecent(q: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  const list = [q.trim(), ...readRecent().filter((x) => x.toLowerCase() !== q.trim().toLowerCase())].slice(0, 6);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function SearchAutocomplete({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const debounced = useDebounced(q, 200);
  const { data, isFetching } = useQuery({
    queryKey: ["autocomplete", debounced],
    queryFn: () => autocompleteProductsFn({ data: { q: debounced } }),
    enabled: debounced.trim().length >= 2,
    staleTime: 30_000,
  });

  function submit(value: string) {
    const v = value.trim();
    if (!v) return;
    pushRecent(v);
    setRecent(readRecent());
    setOpen(false);
    navigate({ to: "/search", search: { q: v } as never });
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); submit(q); }}
      >
        <label htmlFor="site-search" className="sr-only">Search gifts</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="site-search"
            name="q"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search for gifts, flowers, cakes, occasions..."
            className="h-10 rounded-md border-border bg-surface pl-9"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
          )}
        </div>
      </form>

      {open && (q.trim().length >= 2 || recent.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-lg">
          {q.trim().length < 2 && recent.length > 0 && (
            <div className="p-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => submit(r)}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs hover:bg-accent"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q.trim().length >= 2 && (data?.categories?.length ?? 0) > 0 && (
            <div className="border-b border-border p-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
              {data!.categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/c/$category"
                  params={{ category: c.slug }}
                  onClick={() => setOpen(false)}
                  className="block rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {q.trim().length >= 2 && (
            <div className="p-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
              {(data?.products?.length ?? 0) === 0 && !isFetching ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">No matches. Press Enter to search all.</p>
              ) : (
                data?.products.map((p) => (
                  <Link
                    key={p.slug}
                    to="/p/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <img src={p.image} alt="" className="size-10 rounded object-cover" loading="lazy" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{formatPricePaise(p.pricePaise)}</span>
                  </Link>
                ))
              )}
              <button
                type="button"
                onClick={() => submit(q)}
                className="mt-1 block w-full rounded px-2 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
              >
                See all results for “{q}” →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
