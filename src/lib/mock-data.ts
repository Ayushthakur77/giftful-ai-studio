/**
 * Phase 5 compatibility shim.
 *
 * Older components imported `products`, `MockProduct`, `formatPrice`, etc.
 * from `mock-data`. Phase 5 consolidated the seed into `src/lib/catalog.ts`
 * with money in paise. This module re-exports the new source in shapes the
 * legacy imports expect (prices in rupees, `image`, `mrp`, `personalizable`).
 *
 * New code should import from `@/lib/catalog` directly.
 */

import {
  products as _products,
  categories as _categories,
  occasions as _occasions,
  recipients as _recipients,
  heroImage as _heroImage,
  boxBuilderImage as _boxBuilderImage,
  formatINR,
  type Product,
} from "./catalog";

export type MockProduct = {
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp?: number;
  rating: number;
  ratingCount: number;
  badge?: string;
  personalizable?: boolean;
};

export const products: MockProduct[] = _products.map(toMock);
export const categories = _categories.map((c) => ({ slug: c.slug, name: c.name }));
export const occasions = _occasions;
export const recipients = _recipients;
export const heroImage = _heroImage;
export const boxBuilderImage = _boxBuilderImage;

export function formatPrice(rupees: number) {
  return formatINR(rupees * 100);
}

export function toMock(p: Product): MockProduct {
  return {
    slug: p.slug,
    name: p.name,
    image: p.image,
    price: Math.round(p.pricePaise / 100),
    mrp: p.mrpPaise ? Math.round(p.mrpPaise / 100) : undefined,
    rating: p.rating,
    ratingCount: p.ratingCount,
    badge: p.badge,
    personalizable: p.isPersonalizable,
  };
}
