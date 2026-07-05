import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles, Truck, RefreshCcw, ShieldCheck, Clock, Cake, Heart, Flower2, Gift, Lamp, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { PriceBlock } from "@/components/product/price-block";
import { SectionHeader, ProductRail } from "@/components/product/product-rail";
import { AiHomeRails } from "@/components/ai/ai-home-rail";
import type { HomepageSection } from "@/lib/homepage.functions";

/* ---------- utilities ---------- */
function Chevron() { return <ChevronRight className="size-4 shrink-0" aria-hidden />; }

/* ---------- hero (single or slider) ---------- */
type Slide = {
  eyebrow?: string; title?: string; subtitle?: string;
  image?: string; align?: "left" | "right" | "center";
  ctaLabel?: string; ctaHref?: string;
  secondaryCtaLabel?: string; secondaryCtaHref?: string;
  bgColor?: string;
};

function HeroSlider({ section }: { section: HomepageSection }) {
  const slides = ((section.data?.slides as Slide[]) ?? []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  const s = slides[idx]!;
  return (
    <section className="container-page pt-6 md:pt-8">
      <div
        className="relative grid overflow-hidden rounded-2xl border border-border md:grid-cols-2"
        style={{ background: s.bgColor ?? "hsl(var(--surface))" }}
      >
        <div className="flex flex-col justify-center gap-4 p-6 md:p-10 lg:p-14">
          {s.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{s.eyebrow}</p>
          )}
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            {s.title ?? section.title ?? "Send joy across India in a click."}
          </h1>
          {(s.subtitle ?? section.subtitle) && (
            <p className="max-w-md text-sm text-muted-foreground md:text-base">{s.subtitle ?? section.subtitle}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            {s.ctaLabel && s.ctaHref && (
              <Button asChild size="lg" className="h-11">
                <a href={s.ctaHref}>{s.ctaLabel}</a>
              </Button>
            )}
            {s.secondaryCtaLabel && s.secondaryCtaHref && (
              <Button asChild variant="outline" size="lg" className="h-11">
                <a href={s.secondaryCtaHref}>{s.secondaryCtaLabel}</a>
              </Button>
            )}
          </div>
          {slides.length > 1 && (
            <div className="mt-4 flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-4 bg-border"}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="relative aspect-[4/3] md:aspect-auto">
          {s.image ? (
            <img
              src={s.image}
              alt={s.title ?? "Hero"}
              className="h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- USP strip ---------- */
type UspItem = { icon?: string; title: string; subtitle?: string };
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck, refresh: RefreshCcw, shield: ShieldCheck, clock: Clock, sparkles: Sparkles,
};
function UspStrip({ section }: { section: HomepageSection }) {
  const items = ((section.data?.items as UspItem[]) ?? []);
  const defaults: UspItem[] = [
    { icon: "truck", title: "Free delivery over ₹50", subtitle: "Flat ₹70 below" },
    { icon: "clock", title: "Same-day delivery", subtitle: "In select cities" },
    { icon: "shield", title: "Secure payments", subtitle: "UPI, cards, wallets" },
    { icon: "sparkles", title: "AI Gift Finder", subtitle: "Perfect pick in seconds" },
  ];
  const list = items.length ? items : defaults;
  return (
    <section className="container-page py-6">
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        {list.map((it, i) => {
          const Icon = ICONS[it.icon ?? "sparkles"] ?? Sparkles;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary"><Icon className="size-5" /></div>
              <div>
                <p className="text-sm font-semibold">{it.title}</p>
                {it.subtitle && <p className="text-xs text-muted-foreground">{it.subtitle}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- banner strip / promo card ---------- */
function BannerStrip({ section }: { section: HomepageSection }) {
  const { image, ctaLabel, ctaHref } = section.data ?? {};
  return (
    <section className="container-page py-6">
      <a
        href={ctaHref ?? "/search"}
        className="group relative flex min-h-[140px] items-center justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-6 md:min-h-[180px] md:p-10"
      >
        <div className="relative z-10 max-w-lg">
          {section.title && <h3 className="font-display text-xl font-bold md:text-2xl">{section.title}</h3>}
          {section.subtitle && <p className="mt-1 text-sm text-muted-foreground md:text-base">{section.subtitle}</p>}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
            {ctaLabel ?? "Shop now"} <Chevron />
          </span>
        </div>
        {image && (
          <img src={image} alt="" className="pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-90 md:w-1/3" loading="lazy" />
        )}
      </a>
    </section>
  );
}

/* ---------- countdown offer ---------- */
function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  const ms = Math.max(0, end - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms / 3600000) % 24);
  const m = Math.floor((ms / 60000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return { d, h, m, s, done: ms === 0 };
}

function CountdownOffer({ section }: { section: HomepageSection }) {
  const { endsAt, ctaLabel, ctaHref, code } = section.data ?? {};
  const cd = useCountdown(endsAt ?? null);
  if (cd?.done && endsAt) return null;
  return (
    <section className="container-page py-6">
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-primary p-6 text-primary-foreground md:flex-row md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Limited time</p>
          <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">{section.title ?? "Flash offer"}</h3>
          {section.subtitle && <p className="mt-1 text-sm opacity-90">{section.subtitle}</p>}
          {code && (
            <p className="mt-2 text-sm">Use code <span className="rounded bg-white/20 px-2 py-0.5 font-mono font-bold">{code}</span></p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {cd && (
            <div className="flex gap-2 text-center font-mono">
              {[
                { l: "D", v: cd.d }, { l: "H", v: cd.h },
                { l: "M", v: cd.m }, { l: "S", v: cd.s },
              ].map((x) => (
                <div key={x.l} className="min-w-14 rounded-md bg-white/15 p-2">
                  <div className="text-2xl font-bold">{String(x.v).padStart(2, "0")}</div>
                  <div className="text-[10px] opacity-80">{x.l}</div>
                </div>
              ))}
            </div>
          )}
          <Button asChild variant="secondary" size="lg" className="h-11">
            <a href={ctaHref ?? "/search"}>{ctaLabel ?? "Shop now"}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- grids ---------- */
function CategoryGrid({ section }: { section: HomepageSection }) {
  const cats = (section.data?.categories ?? []) as { slug: string; name: string; icon_url: string | null }[];
  if (!cats.length) return null;
  return (
    <section className="container-page py-8 md:py-10">
      <SectionHeader title={section.title ?? "Shop by category"} subtitle={section.subtitle ?? undefined} ctaLabel="Browse all" ctaTo="/search" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
        {cats.map((c) => (
          <Link
            key={c.slug}
            to="/c/$category"
            params={{ category: c.slug }}
            className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-shadow hover:shadow-md"
          >
            {c.icon_url ? (
              <img src={c.icon_url} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
            ) : (
              <span className="text-3xl" aria-hidden>🎁</span>
            )}
            <span className="text-xs font-semibold text-foreground md:text-sm">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OccasionGrid({ section }: { section: HomepageSection }) {
  const items = (section.data?.occasions ?? []) as { slug: string; name: string; emoji?: string; image?: string }[];
  if (!items.length) return null;

  // Curated palette + icon per common occasion — falls back to neutral card.
  const themes: Record<string, { gradient: string; ring: string; Icon: React.ComponentType<{ className?: string }> }> = {
    birthday:    { gradient: "from-rose-100 via-rose-50 to-amber-50",     ring: "ring-rose-200/60",    Icon: Cake },
    anniversary: { gradient: "from-fuchsia-100 via-pink-50 to-rose-50",   ring: "ring-fuchsia-200/60", Icon: Heart },
    wedding:     { gradient: "from-amber-100 via-yellow-50 to-white",     ring: "ring-amber-200/60",   Icon: Flower2 },
    rakhi:       { gradient: "from-orange-100 via-amber-50 to-rose-50",   ring: "ring-orange-200/60", Icon: Gift },
    diwali:      { gradient: "from-yellow-100 via-orange-50 to-rose-50",  ring: "ring-yellow-300/60", Icon: Lamp },
    corporate:   { gradient: "from-slate-100 via-neutral-50 to-white",    ring: "ring-slate-200/60",  Icon: Briefcase },
  };
  const fallback = { gradient: "from-primary/10 via-primary/5 to-transparent", ring: "ring-primary/20", Icon: Sparkles };

  return (
    <section className="container-page py-10 md:py-14">
      <SectionHeader title={section.title ?? "Shop by occasion"} subtitle={section.subtitle ?? undefined} />
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-5">
        {items.map((o) => {
          const t = themes[o.slug] ?? fallback;
          const Icon = t.Icon;
          return (
            <Link
              key={o.slug}
              to="/o/$occasion"
              params={{ occasion: o.slug }}
              className="group relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-card p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.18)] hover:ring-2"
            >
              {/* Soft gradient wash */}
              <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${t.gradient} opacity-70 transition-opacity duration-300 group-hover:opacity-100`} aria-hidden />
              {/* Radial glow on hover */}
              <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />

              <span className={`relative grid size-14 place-items-center rounded-full bg-white/80 ring-1 ${t.ring} shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}>
                <Icon className="size-6 text-foreground/80" />
              </span>
              <span className="relative font-display text-xs font-semibold tracking-wide text-foreground md:text-sm">{o.name}</span>
              <span className="relative text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">Explore</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RecipientGrid({ section }: { section: HomepageSection }) {
  const items = (section.data?.recipients ?? []) as { slug: string; name: string; tagline: string | null; image_url: string | null }[];
  if (!items.length) return null;
  return (
    <section className="container-page py-8 md:py-10">
      <SectionHeader title={section.title ?? "Shop by recipient"} subtitle={section.subtitle ?? undefined} ctaLabel="See all" ctaTo="/recipients" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
        {items.map((r) => (
          <Link
            key={r.slug}
            to="/r/$recipient"
            params={{ recipient: r.slug }}
            className="group flex flex-col items-center gap-2 overflow-hidden rounded-xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md"
          >
            <div className="aspect-square w-full max-w-24 overflow-hidden rounded-full bg-muted">
              {r.image_url ? (
                <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden>🎁</div>
              )}
            </div>
            <span className="text-sm font-semibold">{r.name}</span>
            {r.tagline && <span className="line-clamp-1 text-xs text-muted-foreground">{r.tagline}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}


function GiftboxGrid({ section }: { section: HomepageSection }) {
  const boxes = (section.data?.boxes ?? []) as { slug: string; name: string; images: unknown; price_paise: number; offer_price_paise: number | null }[];
  if (!boxes.length) return null;
  return (
    <section className="container-page py-8 md:py-10">
      <SectionHeader title={section.title ?? "Ready-made gift boxes"} subtitle={section.subtitle ?? undefined} ctaLabel="Shop boxes" ctaTo="/gift-boxes" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
        {boxes.slice(0, 8).map((b) => {
          const image = Array.isArray(b.images) && typeof b.images[0] === "string" ? (b.images[0] as string) : "/placeholder.svg";
          const price = b.offer_price_paise ?? b.price_paise;
          const mrp = b.offer_price_paise ? b.price_paise : undefined;
          return (
            <Link key={b.slug} to="/gift-boxes" className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={image} alt={b.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              </div>
              <p className="line-clamp-2 text-sm font-medium">{b.name}</p>
              <PriceBlock pricePaise={price} mrpPaise={mrp} size="sm" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ImageCards({ section }: { section: HomepageSection }) {
  const cards = ((section.data?.cards ?? []) as { title?: string; subtitle?: string; image?: string; href?: string; ctaLabel?: string }[]);
  if (!cards.length) return null;
  return (
    <section className="container-page py-8 md:py-10">
      {section.title && <SectionHeader title={section.title} subtitle={section.subtitle ?? undefined} />}
      <div className={`grid gap-4 md:grid-cols-${Math.min(cards.length, 3)}`}>
        {cards.map((c, i) => (
          <a
            key={i}
            href={c.href ?? "/search"}
            className="group relative flex min-h-40 flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card p-5"
          >
            {c.image && <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10 text-white">
              {c.title && <h4 className="font-display text-xl font-bold">{c.title}</h4>}
              {c.subtitle && <p className="mt-1 text-sm opacity-90">{c.subtitle}</p>}
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">
                {c.ctaLabel ?? "Explore"} <Chevron />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------- product rails ---------- */
function ProductsRail({ section, defaultTitle }: { section: HomepageSection; defaultTitle: string }) {
  const products = (section.data?.products ?? []) as any[];
  if (!products.length) return null;
  return (
    <ProductRail title={section.title ?? defaultTitle} subtitle={section.subtitle ?? undefined} ctaLabel="See all" ctaTo="/search">
      {products.map((p) => <ProductCard key={p.slug} product={p} />)}
    </ProductRail>
  );
}

/* ---------- festival banner ---------- */
function FestivalBanner({ section }: { section: HomepageSection }) {
  const f = section.data?.festival as { slug: string; name: string; description: string | null; banner_url: string | null; theme_color: string | null } | null;
  if (!f) return null;
  return (
    <section className="container-page py-6">
      <a
        href={`/search?q=${encodeURIComponent(f.name)}`}
        className="group relative flex min-h-[160px] items-center overflow-hidden rounded-2xl border border-border p-6 md:p-10"
        style={{ background: f.theme_color ?? "hsl(var(--surface))" }}
      >
        <div className="relative z-10 max-w-lg text-white">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-90">{section.title ?? "Festival"}</p>
          <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">{f.name}</h3>
          {f.description && <p className="mt-1 text-sm opacity-90">{f.description}</p>}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">Shop the collection <Chevron /></span>
        </div>
        {f.banner_url && <img src={f.banner_url} alt={f.name} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60" loading="lazy" />}
      </a>
    </section>
  );
}

/* ---------- testimonials ---------- */
function TestimonialsSection({ section }: { section: HomepageSection }) {
  const items = (section.data?.testimonials ?? []) as { author_name: string; author_city: string | null; avatar_url: string | null; rating: number; quote: string }[];
  if (!items.length) return null;
  return (
    <section className="container-page py-8 md:py-12">
      <SectionHeader title={section.title ?? "What our customers say"} subtitle={section.subtitle ?? undefined} />
      <div className="grid gap-4 md:grid-cols-3">
        {items.slice(0, 6).map((t, i) => (
          <figure key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm text-[color:var(--rating)]" aria-label={`${t.rating} stars`}>
              {"★".repeat(t.rating)}<span className="text-muted-foreground">{"★".repeat(Math.max(0, 5 - t.rating))}</span>
            </div>
            <blockquote className="mt-2 text-sm text-foreground">"{t.quote}"</blockquote>
            <figcaption className="mt-3 flex items-center gap-2">
              {t.avatar_url && <img src={t.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" loading="lazy" />}
              <span className="text-xs font-semibold text-muted-foreground">— {t.author_name}{t.author_city ? `, ${t.author_city}` : ""}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- ai recs (existing) ---------- */
function AiRecs() { return <AiHomeRails />; }

/* ---------- renderer ---------- */
export function HomepageRenderer({ sections }: { sections: HomepageSection[] }) {
  return (
    <>
      {sections.map((s) => {
        switch (s.kind) {
          case "hero":
          case "hero_slider":
          case "slider":
            return <HeroSlider key={s.id} section={s} />;
          case "usp_strip":
            return <UspStrip key={s.id} section={s} />;
          case "banner_strip":
          case "promo_card":
            return <BannerStrip key={s.id} section={s} />;
          case "countdown_offer":
            return <CountdownOffer key={s.id} section={s} />;
          case "category_grid":
            return <CategoryGrid key={s.id} section={s} />;
          case "occasion_grid":
            return <OccasionGrid key={s.id} section={s} />;
          case "recipient_grid":
            return <RecipientGrid key={s.id} section={s} />;
          case "giftbox_grid":
            return <GiftboxGrid key={s.id} section={s} />;
          case "image_cards":
            return <ImageCards key={s.id} section={s} />;
          case "featured":
            return <ProductsRail key={s.id} section={s} defaultTitle="Featured gifts" />;
          case "trending":
            return <ProductsRail key={s.id} section={s} defaultTitle="Trending now" />;
          case "best_sellers":
            return <ProductsRail key={s.id} section={s} defaultTitle="Best sellers" />;
          case "new_arrivals":
            return <ProductsRail key={s.id} section={s} defaultTitle="New arrivals" />;
          case "product_showcase":
            return <ProductsRail key={s.id} section={s} defaultTitle="Handpicked for you" />;
          case "festival":
            return <FestivalBanner key={s.id} section={s} />;
          case "testimonials":
            return <TestimonialsSection key={s.id} section={s} />;
          case "ai_recommendations":
            return <AiRecs key={s.id} />;
          default:
            return null;
        }
      })}
    </>
  );
}
