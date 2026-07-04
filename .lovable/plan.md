# Auth Migration Plan — Custom → Lovable Cloud

## Goal
Aapka current custom Google OAuth + email/password backend (`src/server/services/google-oauth.service.ts`, `sessions` table, `auth.functions.ts`, `session.functions.ts`, custom callback routes) hata kar Lovable Cloud ke built-in Supabase Auth par shift karna. Google + Email/Password dono support.

## Scope of Change (bada refactor hai)

### Remove
- `src/routes/api/auth.google.callback.ts`
- `src/routes/api/auth.google.start.ts`
- `src/server/services/google-oauth.service.ts`
- `src/components/auth/google-sign-in-button.tsx` (naye Lovable helper se replace)
- Custom `sessions` table use, `session.functions.ts` ke server-side session lookup ka logic
- `src/lib/auth.functions.ts` mein manual password hashing / signup / login logic

### Add / Rewrite
1. **Google provider config** — `supabase--configure_social_auth` call karke Google enable karna (managed credentials).
2. **`src/routes/auth.sign-in.tsx`** — rewrite:
   - Email/password: `supabase.auth.signInWithPassword({ email, password })`
   - Google button: `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
3. **`src/routes/auth.sign-up.tsx`** — rewrite:
   - `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })`
   - Google button (same as above)
4. **`src/routes/auth.forgot-password.tsx`** — `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
5. **`src/routes/reset-password.tsx`** — `supabase.auth.updateUser({ password })`
6. **`src/routes/__root.tsx`** — root pe `supabase.auth.onAuthStateChange` subscribe karke `router.invalidate()` + selective query invalidation.
7. **Session hydration** — `session.functions.ts` ki jagah root/`_authenticated` layout `supabase.auth.getUser()` use karega. Account routes ko `_authenticated/` folder mein move karna hoga taaki managed auth gate protect kare (ya minimal top-level guards banane honge).
8. **Profiles table** — agar `profiles` (username, avatar) chahiye toh migration se create + trigger jo `auth.users` se auto-populate kare. **Question**: kya aapko profile table chahiye? (mujhe lag raha hai haan kyunki `account.profile.tsx` exist karta hai)
9. **Sign-out** — `supabase.auth.signOut()` + query cache clear.

### Database
- Purani `users` / `sessions` tables ko turant drop nahi karunga — abhi bas naye auth use ke liye code switch karunga. User data migration alag task hai (existing users ko naye system mein import karna). Agar aap chahein toh main users ko preserve karne ke liye ek script bana sakta hoon, warna sab log ko dobara signup karna hoga.

## Big Risks
- **Existing users ke passwords lost ho jayenge** — custom `users` table ke hashed passwords Supabase Auth mein import karna manual kaam hai. Naye system mein sab ko re-signup ya password-reset karna hoga.
- **Account/order data** — agar existing orders `users.id` (custom) se linked hain, unhe naye `auth.users.id` se re-link karna hoga. Empty DB ho toh koi baat nahi; bhari DB ho toh migration script chahiye.
- Bahut saari files chhoona padega (~15-20 files edit/delete). Kuch account/admin routes tootne ka risk hai jab tak sab test na ho.

## Please Confirm Before I Start

1. **Profiles table**: create karun (username, avatar_url, etc.)? — default **haan**.
2. **Existing users/orders data**: kya DB abhi khali hai (development), ya production data hai jo preserve karna zaroori hai?
3. **Sequencing**: kya main ek hi turn mein sab kar doon (badi PR), ya step-by-step (pehle sign-in/sign-up, phir account routes)?

Jawab dete hi implement karta hoon.
