# Phase 5 — Core E-Commerce Engine

Phase 5 depends on commerce tables + services that were stubbed in 4a but never implemented. I'll fold that work in as **Phase 4b** and then build the Phase 5 UI on top of it, in one drop.

## Scope

### 4b — Commerce foundation (server)
Finish the Drizzle schema stubs and add repositories + services for:

- `categories` (unlimited depth, `parent_id`, `slug`, `display_order`, `is_hidden`, `type`: standard | occasion | relationship | festival | price | trending | featured | recent)
- `products` (SKU, slug, title, description, base_price, sale_price, currency, stock, weight_g, is_active, is_customizable, is_giftbox_compatible, rating_avg, rating_count)
- `product_images`, `product_variants`, `product_tags`, `product_categories` (M:N)
- `personalization_options` (per product: name, message, font, color, image upload, extra_cost, max_chars, allowed_formats, max_upload_kb)
- `giftbox_templates` (empty boxes: capacity_slots, max_weight_g, allowed_category_ids[], allowed_product_ids[], price, image)
- `giftbox_ribbons`, `giftbox_fillers`, `greeting_cards` (each with price + image)
- `readymade_giftboxes` + `readymade_giftbox_items`
- `wishlists` + `wishlist_items` (user-scoped, unique on (user_id, product_id))
- `carts` + `cart_items` (user_id nullable → guest carts keyed by cookie `giftty_cart`)
- `cart_item_personalization`, `cart_item_giftbox` (structured JSONB payload validated by Zod)
- `coupons` (stub for Phase 6; schema only)

Services:

- `catalog.service.ts` — listCategories(tree), listProducts(filters, sort, page), getProduct(slug), search(q), suggestions(q)
- `wishlist.service.ts` — list/add/remove/move-to-cart (auth required)
- `cart.service.ts` — get/add/update/remove/merge-guest-on-login
- `giftbuilder.service.ts` — validate(box, items, ribbon, filler, card, note, personalization) → priced draft
- `price.service.ts` — single source of truth for line + cart totals (products, personalization surcharges, box/ribbon/filler/card add-ons, subtotal, tax stub, shipping stub, grand total). All money in integer minor units (paise).

Server functions in `src/lib/*.functions.ts` for each service. Zod validators. Server enforces stock, capacity, weight, allowed_products, price recompute. Client only displays server totals.

Seed: ~20 demo products across 4 categories, 3 empty boxes, 2 readymade boxes, ribbons/fillers/cards — so the UI is immediately shoppable.

### Phase 5 — Shopping UI
Wire and build:

- **Header search** with debounced suggestions (`/api/search/suggest`), recent searches in `localStorage`, popular searches from server.
- **Category tree** in mega-menu + `/c/$slug` landing.
- **Catalog `/shop`** — grid/list toggle, filter sidebar (price range, category, occasion, recipient, rating, availability, discount, customizable, giftbox-compatible), sort dropdown, pagination, empty state.
- **Product card** — image, price, discount %, rating, wishlist heart, quick-view dialog, Add to Cart, Buy Now, Personalize badge, Gift-Box-Compatible badge.
- **Product detail `/p/$slug`** — gallery with zoom, tabs (description, specs, reviews stub), personalization panel with live extra-cost preview, delivery estimator (pin code → server stub), related + recommended + recently-viewed (localStorage).
- **Gift Builder `/gift-builder`** — 8-step wizard (Box → Products → Ribbon → Filler → Card → Note → Summary → Add to Cart) with server-side validate-on-next, edit-any-step, capacity/weight meter.
- **Ready-made boxes `/gift-boxes`** + detail page showing contents.
- **Wishlist `/wishlist`** — auth-gated, count badge in header, move-to-cart.
- **Cart `/cart`** — line editor, personalization summary, giftbox summary, coupon input (disabled placeholder until Phase 6), server-computed totals panel, Move-to-Wishlist, Proceed-to-Checkout (routes to Phase 6 placeholder).
- **Guest cart** cookie; on sign-in, merge into user cart.

## Technical notes (for me)

- All money as `integer` paise; format at render with `Intl.NumberFormat("en-IN")`.
- Filter state → URL search params via `validateSearch` + `zodValidator` (Phase 5's canonical read shape).
- TanStack Query for all reads; `ensureQueryData` in loaders, `useSuspenseQuery` in components. `defaultPreloadStaleTime: 0` already set in 4a.
- Server functions using `requireAuth`/`requireRole` never called from public route loaders — call from components via `useServerFn`.
- Cart/wishlist mutations invalidate `['cart']` / `['wishlist']` query keys; header badges subscribe.
- Personalization + giftbox payloads stored as validated JSONB with a Zod schema shared client + server.
- Image uploads for personalization deferred — Phase 5 accepts URL/base64 stub through storage.service (already stubbed) and validates size; real upload lands with storage provider keys.
- No checkout, no payments, no coupons execution, no reviews write — those are Phase 6/7.

## Deliverable order in the drop

1. Extend `src/server/db/schema.ts` with full commerce tables.
2. Add repositories under `src/server/db/repositories/`.
3. Add services under `src/server/services/`.
4. Add server functions under `src/lib/*.functions.ts`.
5. Add seed data to `src/server/db/seed.ts` (idempotent).
6. Build routes + components under `src/routes/` and `src/components/shop/`, `src/components/gift-builder/`, `src/components/cart/`.
7. Update header (search box + wishlist/cart badges).
8. Replace any remaining mock-data usage on the home page with real featured/trending queries.

Reply **"Approved, build Phase 5"** and I'll drop it in one shot. It's a large drop — expect ~40–60 new/edited files.
