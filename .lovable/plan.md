
# Phase 4a — Backend Foundation

Goal: ship the portable spine (DB + auth + RBAC + adapters + env validation) so 4b (commerce) and 4c (admin/AI) drop in cleanly. No vendor lock-in. Neon Postgres via Drizzle. Zero business logic yet — that's 4b/4c.

## Folder layout added

```text
src/server/
  config/env.ts              # Zod-validated env, read inside server boundary
  db/
    client.ts                # drizzle(postgres-js) singleton
    schema/                  # one file per domain, re-exported from index.ts
      users.ts               # users, accounts, sessions, verification_tokens, user_roles
      addresses.ts
      catalog.ts             # categories, occasions, recipient_types (stubs)
      products.ts            # products, product_images, variants, personalization_fields (stubs)
      commerce.ts            # carts, cart_items, orders, order_items, payments (stubs, 4b fills)
      giftbox.ts             # gift_boxes, gift_box_items, greeting_cards, ribbons, fillers (stubs)
      marketing.ts           # coupons, coupon_usage, homepage_sections, banners (stubs)
      ops.ts                 # inventory, inventory_movements, stock_reservations (stubs)
      support.ts             # reviews, review_images, tickets, notifications (stubs)
      audit.ts               # audit_logs, error_logs, ai_logs, activity_logs
    migrations/              # drizzle-kit generated SQL
    seed.ts                  # seeds super_admin role + Super Admin user from env
  services/                  # interfaces + default impls (business code uses these)
    auth.service.ts
    storage.service.ts
    email.service.ts
    payment.service.ts
    ai.service.ts
  adapters/                  # vendor wrappers behind service interfaces
    auth/authjs.adapter.ts
    storage/s3.adapter.ts    # R2 via S3 API (stub, wired in 4b)
    email/resend.adapter.ts  # stub
    payment/razorpay.adapter.ts  # stub
    ai/openai-compat.adapter.ts  # stub, LOVABLE_API_KEY for dev
  middleware/
    require-auth.ts          # TanStack server-fn middleware, returns { userId, roles }
    require-role.ts          # RBAC: requireRole('super_admin')
    audit.ts                 # writes audit_logs on protected mutations
  repositories/              # thin data access; only place that imports drizzle
    users.repo.ts
    roles.repo.ts
    audit.repo.ts
drizzle.config.ts
```

Golden import direction: `routes → server/functions → services → repositories → drizzle`. Adapters implement service interfaces; nothing imports adapters directly.

## Database (Phase 4a — creates & seeds only)

Full tables **created** in 4a (used by auth immediately):
`users`, `accounts`, `sessions`, `verification_tokens`, `user_roles`, `audit_logs`.

Tables **defined but empty** (schema shipped so 4b just fills logic):
addresses, categories, occasions, recipient_types, products, product_images, product_variants, personalization_fields, gift_boxes, gift_box_items, greeting_cards, ribbons, fillers, carts, cart_items, wishlists, orders, order_items, payments, coupons, coupon_usage, reviews, review_images, notifications, inventory, inventory_movements, stock_reservations, homepage_sections, banners, festival_campaigns, ai_logs, error_logs, activity_logs, store_settings.

Conventions (enforced everywhere):
- `id uuid` PK via `gen_random_uuid()`
- Money in `paise` (int)
- Timestamps `created_at`, `updated_at` (trigger), `deleted_at` on soft-delete entities
- FKs with explicit `ON DELETE`
- Indexes on every FK + slug + status columns
- Enum types via Postgres `pgEnum`
- No RLS (portable), authorization enforced in server functions

## Super Admin rules (baked in)

- `user_roles` table with pgEnum `app_role` = `super_admin`, `customer`, `staff` (future).
- Migration seed script (`src/server/db/seed.ts`, run once via `bun run db:seed`):
  1. Reads `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` from env.
  2. Argon2-hashes password (never stored plaintext).
  3. Upserts user + `super_admin` role. Idempotent.
- Public sign-up (`auth.service.signUpEmail`) hard-codes role = `customer`. Cannot elevate.
- Google OAuth callback: if email === `SUPER_ADMIN_EMAIL` → attach `super_admin` role; else `customer`. Comparison server-side only.
- `requireRole('super_admin')` middleware guards every `/admin/*` server fn.
- Admin route tree gated in `beforeLoad` — hidden from all others (menu, links, APIs).
- Every super_admin mutation writes to `audit_logs` (actor, action, entity, before/after JSON, ip, ua).
- Future staff accounts: only created via `admin.createStaff` server fn (super_admin only). No public path.

## Auth (Auth.js core + Drizzle adapter)

- Credentials provider (email + argon2 password) + Google OAuth.
- DB sessions (not JWT), 30-day sliding.
- httpOnly + Secure + SameSite=Lax cookies.
- CSRF via Auth.js.
- Password reset via signed token in `verification_tokens`.
- Server fns: `auth.signUp`, `auth.signIn`, `auth.signOut`, `auth.requestPasswordReset`, `auth.resetPassword`, `auth.me`.

## Env validation (`src/server/config/env.ts`)

Zod schema, called from server-only boundary. Required in 4a: `DATABASE_URL`, `AUTH_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`. Optional (warn, don't crash): Google, R2, Razorpay, Resend, AI. Adapter throws a clear "not configured" error when called before its vars are set — nothing silently no-ops.

## Deliverables checklist (4a)

- [ ] Drizzle + `postgres-js` + `drizzle-kit` + `@auth/core` + `@auth/drizzle-adapter` + `argon2` + `zod` installed
- [ ] All schema files created (full for auth tables; stubs for 4b/4c tables)
- [ ] `drizzle.config.ts` + `bun run db:generate` / `db:migrate` / `db:seed` scripts
- [ ] Env validator with clear error messages
- [ ] Auth service + Auth.js adapter working end-to-end (sign up as customer, sign in, sign out, me)
- [ ] Super Admin seeded from env, argon2 hashed, idempotent
- [ ] RBAC middleware + `/_admin` route guard
- [ ] Audit log writer wired into role/staff mutations
- [ ] Wire real sign-in/sign-up pages (`/auth/*`) to `auth.*` server fns
- [ ] README section: `bun install → set DATABASE_URL → db:migrate → db:seed → dev`

## What 4a does NOT ship (on purpose)

- Products/cart/orders/payments/inventory business logic → **4b**
- Admin CRUD UI, AI endpoints, coupons, reviews, analytics → **4c**
- R2 uploads, Razorpay wiring, Resend emails → stubs only; enabled when you supply keys

## Verification before I stop

1. `bun run build` clean.
2. `tsgo` clean.
3. Migration SQL reviewed (no vendor-specific extensions).
4. Manual: sign up new customer → verify `role=customer` in DB. Sign in as Super Admin → `/admin` loads. Sign in as customer → `/admin` redirects to `/`.
5. Attempted role escalation via crafted request → rejected + audit log entry.

---

Reply **"Approved, build 4a"** and I execute. If anything above should change (extra table now, different seed rule, skip Google OAuth for now), tell me and I revise before writing code.
