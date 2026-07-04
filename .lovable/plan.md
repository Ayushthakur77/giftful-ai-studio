## Phase 6 — Customer Identity, Auth & Account Management

Builds on Phase 4a auth (DB sessions, scrypt passwords, RBAC) and Phase 5 client-only wishlist/cart. Everything server-authoritative.

### 1. Google Sign-In (OIDC, no extra deps)
- Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` via `add_secret`; publishable `VITE_GOOGLE_ENABLED` flag.
- Server routes (public, unauth-safe):
  - `GET /api/auth/google/start` → generate state+nonce, set short-lived signed cookie, 302 to Google authorize URL.
  - `GET /api/auth/google/callback` → verify state, exchange code at `oauth2.googleapis.com/token`, fetch userinfo, upsert user (link by email; store `google_sub`, `avatar_url`, mark `email_verified_at`), assign `customer` role if new, create DB session cookie, redirect to `?redirect` or `/account`.
- New `oauth_accounts` table (`provider`, `provider_sub`, `user_id`, unique).
- "Continue with Google" button on `/auth/sign-in` and `/auth/sign-up`.

### 2. Profile & Account
- Extend `users` with `phone`, `phoneVerifiedAt` (nullable). Add `notifications` table.
- Server fns (`profile.functions.ts`, all behind `requireAuth`):
  - `getProfileFn`, `updateProfileFn` (name, phone; Zod: E.164-ish `+?\d{7,15}`), `updateAvatarFn` (URL only for now; upload deferred), `deleteAccountFn` (soft delete → set `deletedAt`, destroy sessions, sign out).
- `/account/profile` — real form with avatar preview, name, email (readonly), phone; save via mutation + toast; danger-zone delete with typed confirm.
- `/account/settings` — sessions list (current + others) with "Sign out other devices" (deletes all sessions except current token hash).

### 3. Address Book
- New `addresses` table: `id`, `user_id`, `full_name`, `phone`, `line1` (house/flat), `line2` (street), `area`, `city`, `state`, `postal_code`, `country` (default `IN`), `landmark`, `type` (`home|work|other`), `is_default`, timestamps. Unique partial index enforcing single default per user.
- Service (`address.service.ts`) + server fns: `listAddressesFn`, `createAddressFn`, `updateAddressFn`, `deleteAddressFn`, `setDefaultAddressFn`. Zod validators: Indian PIN `^\d{6}$`, phone, state from enum of 36 IN states/UTs.
- `/account/addresses` — cards list with edit/delete/set-default, "Add address" dialog form, empty state.

### 4. Location Detection
- Client util `src/lib/geolocation.ts`: `navigator.geolocation.getCurrentPosition` behind explicit "Use my location" button (never auto-prompt).
- Server fn `reverseGeocodeFn({lat,lng})` — uses free `nominatim.openstreetmap.org/reverse` (User-Agent header), maps to `{state, city, postal_code, country}`. Fallback: silent failure → user fills manually. Cached in-memory per request.
- Wired into address form as prefill button.

### 5. Wishlist Sync (guest → user)
- New `wishlist_items` table `(user_id, product_slug, created_at)` unique.
- Server fns: `getWishlistFn`, `addWishlistFn`, `removeWishlistFn`, `mergeWishlistFn(slugs[])`.
- Update `useWishlist` Zustand store to: on auth state change, POST local slugs to `mergeWishlistFn`, then hydrate from server; while signed in, mutations go to server + optimistic local; while guest, localStorage only.
- Same pattern for cart is out of scope here (Phase 5 kept local; will address in checkout phase). Note in code.

### 6. Notifications
- New `notifications` table: `id, user_id, kind (order|payment|shipping|account|promo), title, body, link, read_at, created_at`.
- `listNotificationsFn`, `markReadFn`, `markAllReadFn`.
- Header bell (signed-in only) with unread count badge + dropdown; `/account` dashboard shows latest 5.

### 7. Dashboard `/account`
- Replace placeholder index with real dashboard: greeting, quick stats (orders count, wishlist count, addresses count, unread notifications), Recently Viewed rail (from Phase 5 store), Recommended Products rail (catalog top-rated), latest notifications, quick links.

### 8. Order History
- Real (schema exists for orders stub). `/account/orders` lists orders from DB filtered by `user_id` with status, total, date, items count; `/account/orders/$id` shows detail (items + personalization JSON + shipping address snapshot). Empty state when no orders. Reorder button re-adds SKUs to cart. Cancel button visible when status ∈ {pending, confirmed}.

### 9. Session Hardening
- Session cookie already `httpOnly + secure + sameSite=lax`. Add:
  - `signOutAllFn` (deletes all sessions for user).
  - Rate limit `signInFn` / `signUpFn` per-IP (in-memory token bucket, 10/min).
  - `audit_logs` writes for: signin, signup, signout, profile.update, address.create/update/delete, account.delete, oauth.link.
- Root `__root.tsx` continues to load `meFn` in `beforeLoad`; add `router.invalidate()` calls after auth mutations (already present in sign-in/up; add to sign-out).

### 10. RBAC verification
- `/admin/*` already gated by `context.user?.isSuperAdmin`. Confirm server admin fns use `requireRole('super_admin')` middleware. Add regression: signup never grants `super_admin` (already enforced in `authService.signUp`).

### Files (approx)
- New: `src/routes/api/auth.google.start.ts`, `src/routes/api/auth.google.callback.ts`, `src/lib/profile.functions.ts`, `src/lib/address.functions.ts`, `src/lib/wishlist.functions.ts`, `src/lib/notifications.functions.ts`, `src/lib/orders.functions.ts`, `src/lib/geolocation.ts`, `src/server/services/oauth.service.ts`, `src/server/services/address.service.ts`, `src/server/services/wishlist.service.ts`, `src/server/services/notification.service.ts`, `src/server/services/order.service.ts`, `src/server/lib/rate-limit.ts`, migration for new tables.
- Edited: `src/server/db/schema.ts`, `src/routes/auth.sign-in.tsx`, `src/routes/auth.sign-up.tsx`, `src/routes/account.index.tsx`, `src/routes/account.profile.tsx`, `src/routes/account.addresses.tsx`, `src/routes/account.settings.tsx`, `src/routes/account.orders.tsx`, `src/routes/account.orders.$id.tsx`, `src/components/layout/site-header.tsx`, `src/lib/store.ts`.

### Deferred (not Phase 6)
- Real avatar file upload (needs storage bucket) — URL/Google avatar only.
- SMS phone verification.
- Return/refund requests, support tickets, gift reminders.
- Cart server-sync (paired with checkout phase).
- Promotional push notifications.

### Ask before build
1. Confirm you want me to request **`GOOGLE_CLIENT_ID`** and **`GOOGLE_CLIENT_SECRET`** via the secure secret form? Redirect URI will be `<preview-url>/api/auth/google/callback` and the published equivalent — I'll show both.
2. Any preference on the avatar strategy? (Default plan: Google avatar URL on OAuth signup; text-entry URL in profile until we add storage.)

Reply **"Approved, build Phase 6"** to execute.
