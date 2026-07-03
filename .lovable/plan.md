# Giftty — Phase 3: UI/UX Foundation Spec

Complete design blueprint. **No code will be written until you approve.** After approval I'll implement in the exact order listed at the bottom.

---

## 1. Design Principles (enforced everywhere)

Simplicity → White space → Content-first → Large tap targets → Minimal color → Fast nav → Consistent layout → Mobile-first → WCAG AA → Conversion-optimized.

**Rejected on sight:** heavy gradients, glassmorphism, neon, drop-shadow stacks, decorative animations, dense info walls.

---

## 2. Color System (semantic tokens in `src/styles.css`, OKLCH)

| Token | Value | Use |
|---|---|---|
| `--background` | `oklch(1 0 0)` (pure white) | Page bg |
| `--surface` | `oklch(0.985 0 0)` (very light gray) | Section bands |
| `--card` | `oklch(1 0 0)` | Cards |
| `--border` | `oklch(0.92 0 0)` | Dividers, inputs |
| `--foreground` | `oklch(0.18 0 0)` | Primary text |
| `--muted-foreground` | `oklch(0.48 0 0)` | Secondary text |
| `--primary` | `oklch(0.55 0.19 15)` — deep crimson | CTAs, brand |
| `--primary-foreground` | white | Text on primary |
| `--accent` | `oklch(0.72 0.16 60)` — warm gold | Badges, highlights |
| `--success` | `oklch(0.62 0.15 150)` | In-stock, delivered |
| `--warning` | `oklch(0.72 0.16 65)` | Low stock |
| `--destructive` | `oklch(0.55 0.22 25)` | Errors, remove |
| `--price` | `oklch(0.20 0 0)` | Prices (near-black) |
| `--strike` | `oklch(0.55 0 0)` | MRP strike-through |
| `--rating` | `oklch(0.62 0.15 150)` | Flipkart-style green rating pill |

**Elevation:** 2 shadows only — `--shadow-sm` (cards on hover), `--shadow-md` (modals/drawers). No large glows.

**Dark mode:** deferred to Phase 6 (tokens ready; not styled yet — matches your "white theme first" preference).

---

## 3. Typography

Load via `<link>` in `__root.tsx`. Update from Phase 1 (drop Playfair — too editorial for e-commerce speed):

- **Display / Headings:** `Sora` (600/700) — geometric, modern, trustworthy
- **Body / UI:** `Inter` (400/500/600) — proven readability
- **Numeric (prices):** `Inter` tabular-nums

**Scale (mobile → desktop, rem):**

| Role | Class | Size |
|---|---|---|
| H1 hero | `text-3xl md:text-5xl font-bold` | 30/48 |
| H2 section | `text-2xl md:text-3xl font-semibold` | 24/30 |
| H3 card title | `text-lg font-semibold` | 18 |
| Product title | `text-sm md:text-base font-medium` | 14/16 |
| Body | `text-base` | 16 |
| Price large | `text-xl md:text-2xl font-bold` | 20/24 |
| Meta / rating | `text-xs md:text-sm` | 12/14 |

Line-height: 1.2 (headings), 1.5 (body). Letter-spacing: `-0.01em` on headings.

---

## 4. Spacing, Radius, Grid

**Spacing scale (only these):** 4, 8, 12, 16, 20, 24, 32, 48, 64, 96 px. Tailwind: `1, 2, 3, 4, 5, 6, 8, 12, 16, 24`.

**Radius:** `--radius-sm: 6px` (inputs, badges), `--radius-md: 10px` (cards, buttons), `--radius-lg: 16px` (hero, drawers). No circles except avatars/icon buttons.

**Container:** `max-w-7xl` (1280px) centered, `px-4 md:px-6 lg:px-8`.

**Grid breakpoints:**

| Device | Width | Product grid | Category grid |
|---|---|---|---|
| Mobile | <640 | 2 cols | 3 cols |
| Tablet | 640–1024 | 3 cols | 4 cols |
| Desktop | 1024–1280 | 4 cols | 6 cols |
| Wide | ≥1280 | 5 cols | 6 cols |

**Tap targets:** min 44×44 everywhere (mobile), 40×40 (desktop).

---

## 5. Information Architecture

```text
/                                Homepage
/c/:category                     Category listing (e.g. /c/flowers)
/c/:category/:subcategory        Subcategory (e.g. /c/flowers/roses)
/o/:occasion                     Occasion listing (/o/birthday, /o/diwali)
/p/:slug                         Product Detail
/p/:slug/customize               Personalization editor
/gift-box                        Gift Box Builder (multi-step)
/ai-finder                       AI Gift Finder chat
/search?q=                       Search results
/cart                            Cart
/checkout                        One-page checkout
/account                         Dashboard (layout)
  /account/orders
  /account/orders/:id
  /account/wishlist
  /account/addresses
  /account/profile
  /account/reminders
  /account/reviews
  /account/settings
/auth/sign-in
/auth/sign-up
/auth/forgot-password
/reset-password
/admin                           Admin (layout, role-gated)
  /admin/dashboard
  /admin/products
  /admin/categories
  /admin/orders
  /admin/customers
  /admin/coupons
  /admin/homepage-builder
  /admin/settings
About / Contact / Help / Privacy / Terms / Shipping / Returns / FAQ
```

---

## 6. Global Header (Flipkart-inspired, sticky)

**Desktop (3 rows collapse to 1 on scroll):**
```text
[Logo]  [── Search (occasion/recipient/keyword) ──]  [Login/Account] [Orders] [Wishlist] [Cart(n)]
[Category rail: Personalized | Flowers | Cakes | Chocolates | Hampers | Corporate | Occasions ▼ | Build a Box | AI Finder]
```

**Mobile:**
```text
[☰]  [Logo]  [🔍]  [♥]  [🛒(n)]
── Sticky search bar (collapses to icon on scroll) ──
── Horizontal scroll category chips ──
```

Mobile drawer (☰): full category tree, account, orders, wishlist, help, sign-in/out.

Admin link appears in the profile dropdown **only** when `user_roles` contains `admin`.

---

## 7. Global Footer

4-column desktop, accordion on mobile. Columns: **Shop** (Categories, Occasions, Corporate, Gift Cards) · **Help** (Contact, FAQ, Shipping, Returns, Track Order) · **Company** (About, Careers, Blog, Press) · **Legal** (Privacy, Terms, Refund). Bottom bar: payment icons (Visa/Mastercard/UPI/Razorpay), social (IG/FB/YT), copyright, "Made in India".

---

## 8. Homepage Section Order

1. Hero carousel (3 slides max, editable from admin) — headline + 2 CTAs
2. Trust strip (4 icons: Free shipping ₹499+ · Same-day delivery · 100% safe payments · Easy returns)
3. Shop by Occasion (6 tiles, horizontal scroll on mobile)
4. Shop by Recipient (Him / Her / Kids / Parents / Couple / Colleagues)
5. Personalized Gifts (product rail — "Made just for them")
6. **Build Your Own Gift Box** (2-col promo band + illustration)
7. **AI Gift Finder** (promo card — "Tell us about them, we'll pick")
8. Trending Now (product rail)
9. Ready-made Gift Boxes (product rail)
10. Festival / Seasonal Collection (auto-switches: Diwali/Rakhi/Valentine)
11. Best Sellers (product rail)
12. Recently Viewed (client-side, hidden if empty)
13. Customer Reviews carousel (real Trustpilot-style cards)
14. Newsletter capture (single email field + button)
15. Footer

Every section is a `<HomepageSection>` component with `title`, `subtitle`, `cta`, `children` — admin-editable in Phase 6.

---

## 9. Component Library (shadcn/ui base + Giftty variants)

**Primitives (shadcn):** Button, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Dialog, Drawer, Sheet, Popover, DropdownMenu, Tabs, Accordion, Toast (sonner), Tooltip, Command (search), Skeleton, Separator, Avatar, Badge, Progress, ScrollArea.

**Giftty custom (built on primitives):**

| Component | Purpose |
|---|---|
| `SiteHeader` / `SiteFooter` | Global chrome |
| `ProductCard` | Image · title · rating pill · price · MRP strike · wishlist |
| `ProductCardSkeleton` | Loading state |
| `ProductRail` | Horizontal-scroll section with title + "View all" |
| `PriceBlock` | Price · MRP · discount % · offer text |
| `RatingPill` | Green pill "4.3 ★ | 1.2k" |
| `OccasionTile` | Image + label tile |
| `SectionHeader` | H2 + optional CTA |
| `TrustStrip` | 4-icon promise band |
| `Breadcrumbs` | Auto from route |
| `FiltersSidebar` / `FiltersDrawer` | Desktop sidebar, mobile drawer |
| `SortMenu` | Popularity/Price ↑↓/Newest/Rating |
| `Gallery` | Thumbs + main + zoom (desktop hover, mobile pinch) |
| `QuantityStepper` | −/n/+ (min 44px tap) |
| `PincodeCheck` | Input + "Check delivery" |
| `PersonalizationForm` | Text/image/date fields per product schema |
| `LivePreview` | Canvas preview of personalized product |
| `GiftBoxStepper` | 6-step vertical (mobile) / horizontal (desktop) |
| `GreetingWriter` | AI-assisted textarea |
| `CartLine` | Editable qty, remove, move to wishlist |
| `PriceSummary` | Subtotal · discount · shipping · tax · total |
| `AddressCard` / `AddressForm` | Saved + new |
| `CheckoutSteps` | Compact stepper (Address → Pay) |
| `PaymentMethodPicker` | Razorpay methods |
| `EmptyState` | Icon · title · description · CTA (cart/wishlist/orders/search empty) |
| `ErrorState` | Retry action variants |
| `OfflineBanner` | Detects `navigator.onLine` |
| `ConfirmDialog` | Reusable destructive/neutral |
| `Toast` variants | success/info/warning/error |
| `AdminShell` | Sidebar + topbar layout |
| `DataTable` | Sortable/paginated (TanStack Table) |
| `StatCard` | Admin KPIs |

Every component: keyboard-navigable, `aria-*` correct, focus-visible ring, min 44px targets on mobile.

---

## 10. Key Page Layouts

**Product Listing** — sticky filter bar (mobile: "Filters" + "Sort" buttons opening drawers), 2/3/4/5-col grid, infinite scroll with "Load more" fallback, empty & error states, applied-filter chips.

**Product Detail** — 2-col desktop (gallery left, info right), stacked mobile. Sticky mobile bottom bar with `[♥] [Add to Cart] [Buy Now]`. Sections below fold: Highlights → Description → Specs → Reviews → Related → Recently viewed.

**Gift Box Builder** — 6-step wizard, live price + capacity meter, sticky footer with `[Back] [Next]`, edit-any-step from summary.

**Cart** — 2-col desktop (lines left, summary right sticky), single column mobile with sticky checkout bar. Coupon input, delivery estimate per pincode.

**Checkout** — single page, 2 accordions (Address, Payment) auto-advancing. Guest-checkout disabled (per your Phase 1 spec). Google + email sign-in inline.

**Customer Dashboard** — left sidebar (desktop) / bottom tab bar (mobile) with 7 sections. Order card = status timeline + items + reorder.

**Admin Panel** — `Sidebar (collapsible/icon)` + topbar. DataTable-first CRUD, side drawer for edit (not full page), bulk actions, CSV export.

---

## 11. Motion (restrained)

- Page transitions: none (instant nav feels faster).
- Hover: 150ms ease-out on cards (`translate-y-[-2px]` + shadow-sm).
- Modal/drawer: 200ms slide/fade (Radix defaults).
- Skeleton shimmer: subtle, 1.4s.
- Add-to-cart: cart icon pulse + toast (600ms).
- No parallax, no scroll-triggered reveals in v1.

---

## 12. Accessibility Contract

- WCAG 2.1 AA contrast (all tokens verified above).
- Single `<main>` per route (in `__root.tsx` layout).
- Every icon-only button has `aria-label`.
- Every input has associated `<label>`.
- Focus-visible ring: 2px `--primary` offset 2px.
- Skip-to-content link.
- Escape closes all modals/drawers.
- `prefers-reduced-motion` disables shimmer + transitions.
- Images: `alt` mandatory (decorative → `alt=""`).
- `aria-live="polite"` region for cart updates + toasts.
- Keyboard: all flows completable without mouse.

---

## 13. Performance Contract

- Route-level code splitting (TanStack Router auto).
- Product images: served from R2 via `<img loading="lazy" decoding="async">`, responsive `srcset`, `aspect-ratio` set to prevent CLS.
- Above-the-fold hero image `fetchpriority="high"`.
- Suspense boundaries on product rails.
- Skeletons for all async lists (never spinners on lists).
- Bundle budget: initial JS < 180KB gzipped.

---

## 14. SEO Contract

- Every route sets its own `head()` — unique title + description + og:*.
- Product routes: JSON-LD `Product` + `Offer` + `AggregateRating`.
- Breadcrumb JSON-LD on category/product.
- Canonical + og:url per route (relative until domain set).
- `sitemap.xml` generated at build (products, categories, occasions).
- `robots.txt` allow all except `/account`, `/admin`, `/checkout`.

---

## 15. Universal Screen States

Every async surface defines all 6:
Loading (skeleton) · Empty (illustration + CTA) · Success · Validation error (inline) · Server error (retry) · Offline (banner).

---

## 16. Design System Enforcement

- ESLint rule: forbid raw color classes (`text-white`, `bg-black`, `text-gray-*`, `bg-[#...]`) in `components/**` and `routes/**`. Only tokens.
- Storybook-lite: `/design-system` internal route (dev-only) showing every component + all states. Ensures consistency before use.
- PR checklist (encoded in `AGENTS.md`): tokens only · 44px targets · aria labels · loading + empty + error states · mobile tested.

---

## 17. Implementation Order (post-approval)

Each step is a single build with verification before moving on.

1. **Tokens & fonts** — rewrite `src/styles.css`, drop Playfair, add Sora+Inter via `__root.tsx <link>`, define full OKLCH palette, radius, shadows, spacing utilities. Verify with `/design-system` sandbox.
2. **Layout shell** — `SiteHeader` (desktop 3-row + mobile drawer), `SiteFooter`, single `<main>` in `__root.tsx`, skip-link, scroll restoration.
3. **Primitives audit** — ensure all shadcn components use tokens, add missing ones (Command, Drawer, Sheet, Sonner).
4. **Giftty components v1** — ProductCard, ProductRail, PriceBlock, RatingPill, OccasionTile, SectionHeader, TrustStrip, EmptyState, ErrorState, ConfirmDialog, Skeletons.
5. **Homepage** — rebuild with new tokens + 15 sections listed above (static data only; admin editing = Phase 6).
6. **`/design-system` dev route** — visual catalog of every component + state.
7. **Route scaffolds** — create empty route files for every path in §5 with correct `head()` + breadcrumbs + skeletons, so navigation works end-to-end (no data yet).
8. **Accessibility pass** — run through checklist, fix contrast/labels/keyboard.
9. **Mobile pass** — 375px, 390px, 414px review; fix tap targets, safe-area, sticky bars.
10. **SEO pass** — head metadata, JSON-LD stubs, sitemap generator.

**Verification per step:** dev-server console clean, mobile viewport check, keyboard tab order, contrast spot-check.

Phase 4 (data + auth + Drizzle + Auth.js + R2 + Razorpay + AI adapter wiring) begins only after Phase 3 is signed off.

---

## Approval

Reply **"Approved, start Phase 3"** and I'll begin with step 1 (tokens & fonts) immediately. If you want changes — palette shade, typography pair, section order, or any component list — tell me now and I'll revise the spec before building.
