/**
 * Dynamic homepage section builder.
 *
 * Combines a static festival calendar + wishlist + recently-viewed
 * cookie into a set of AI-personalized rails. Never calls the AI at
 * all when the season is quiet — returns pure rule-based rails to keep
 * the homepage fast and cheap.
 */
import { upcomingFestival, currentSeason } from "@/lib/festivals";
import { listProducts, findProductBySlug, products, type Product } from "@/lib/catalog";

export type HomeSection = {
  key: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  ctaLabel?: string;
  ctaTo?: string;
  productSlugs: string[];
};

export type HomeSectionsInput = {
  wishlistSlugs?: string[];
  recentSlugs?: string[];
};

export function buildHomeSections(input: HomeSectionsInput = {}): HomeSection[] {
  const sections: HomeSection[] = [];

  // 1. Upcoming festival
  const festival = upcomingFestival();
  if (festival) {
    let items = festival.occasionSlug
      ? listProducts({ occasion: festival.occasionSlug, inStockOnly: true }, "popularity")
      : listProducts({ inStockOnly: true }, "popularity").filter((p) =>
          p.tags.some((t) => festival.keywords.some((k) => t.toLowerCase().includes(k.toLowerCase()))),
        );
    if (items.length < 4) {
      items = [...items, ...listProducts({ inStockOnly: true }, "popularity")].slice(0, 8);
    }
    sections.push({
      key: `festival-${festival.slug}`,
      title: `${festival.name} picks`,
      emoji: festival.emoji,
      subtitle: `Gifts your loved ones will love this ${festival.name}`,
      ctaLabel: "Shop all",
      ctaTo: festival.occasionSlug ? `/o/${festival.occasionSlug}` : "/search",
      productSlugs: items.slice(0, 6).map((p) => p.slug),
    });
  }

  // 2. For you — based on wishlist + recently-viewed
  const seed = uniq([...(input.wishlistSlugs ?? []), ...(input.recentSlugs ?? [])]);
  if (seed.length > 0) {
    const seedProducts = seed.map(findProductBySlug).filter((p): p is Product => !!p);
    const forYou = recommendBySimilarity(seedProducts, 6);
    if (forYou.length > 0) {
      sections.push({
        key: "for-you",
        title: "Picked for you",
        subtitle: "Based on what you've browsed and loved",
        productSlugs: forYou.map((p) => p.slug),
      });
    }
  }

  // 3. Seasonal trending
  const season = currentSeason();
  const trending = products.filter((p) => p.isTrending && p.stock > 0).slice(0, 6);
  if (trending.length > 0) {
    sections.push({
      key: "trending",
      title: "Trending now",
      subtitle: `Loved across India this ${season}`,
      productSlugs: trending.map((p) => p.slug),
    });
  }

  return sections;
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function recommendBySimilarity(seed: Product[], count: number): Product[] {
  if (seed.length === 0) return [];
  const seedSlugs = new Set(seed.map((p) => p.slug));
  const cats = new Set(seed.flatMap((p) => [p.category]));
  const occs = new Set(seed.flatMap((p) => p.occasions));
  const recs = new Set(seed.flatMap((p) => p.recipients));

  return products
    .filter((p) => !seedSlugs.has(p.slug) && p.stock > 0)
    .map((p) => ({
      p,
      score:
        (cats.has(p.category) ? 3 : 0) +
        p.occasions.filter((o) => occs.has(o)).length +
        p.recipients.filter((r) => recs.has(r)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.p);
}
