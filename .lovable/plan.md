# Phase 7 — AI Intelligence Engine

Builds the customer-facing AI layer on top of the existing catalog/pricing engine (Phase 5) and identity (Phase 6). All AI calls go through the Lovable AI Gateway on the server. Nothing calls the model from the browser.

## Scope (this drop)

1. **AI backend plumbing**
   - `src/server/services/ai-gateway.service.ts` — thin wrapper around Lovable AI Gateway (`google/gemini-3-flash-preview` default), with `chatJSON()` helper using strict JSON prompting + `Output.object` fallback parser.
   - `src/server/services/ai-context.service.ts` — assembles a *safe* catalog snapshot (in-stock, visible products, box rules, current prices) as context. Never sends PII.
   - `src/server/services/ai-log.service.ts` + `ai_request_logs` drizzle table (id, userId?, feature, model, latencyMs, tokensIn/Out, ok, errorCode, createdAt). Migration added.
   - Simple in-memory per-IP+user token bucket (10 req/min for AI endpoints).

2. **AI Gift Assistant** (`/ai-finder`)
   - Replaces the placeholder. Chat-style form: free text + optional structured filters (occasion, relationship, budget, tone).
   - `aiRecommendGiftsFn` → returns `{ intent, products[], readyBoxes[], customBoxSuggestion?, note, explanations }`. Each item is verified against live catalog (stock, price, visibility) before returning.
   - Result view: recommended products (add-to-cart), ready boxes, a "Build this gift box for me" CTA, editable greeting note.

3. **AI Gift Box Builder**
   - `aiBuildGiftBoxFn({ occasion, relationship, budget, preferences })` → picks empty box, fills items respecting `capacity`, `maxWeightGrams`, `allowedCategories`, `isGiftBoxCompatible`, budget; picks ribbon/filler/card; generates note.
   - Returns a fully-formed `CustomBoxLine` draft. UI on `/gift-box` gets an "AI Build" panel that pre-fills the builder; user can add/remove/replace/edit before adding to cart.
   - Server re-validates via existing `computeCart` — the AI never bypasses pricing rules.

4. **AI Greeting Card Generator**
   - `aiGenerateGreetingFn({ occasion, recipient, tone, language, maxChars })`. Tones: heartfelt, funny, professional, romantic, formal, short, poetic. Language: English / Hindi / Hinglish.
   - Inline "✨ Generate with AI" button on gift-note fields in gift-box builder, custom-box, checkout note. Result is editable text.

5. **AI Natural-Language Search**
   - `aiSearchFn({ q })` → uses AI to extract `{ keywords, categories, priceMax, occasion, tags }` then runs existing catalog search + filters and returns ranked slugs with short reason strings.
   - `/search` gets an "AI Search" toggle; when on, results come from `aiSearchFn` with reason chips.

6. **AI Homepage Personalization**
   - `getHomepageSectionsFn` — server function that returns dynamic sections: `upcomingFestival`, `forYou` (based on wishlist + recently viewed cookie), `trending`, `seasonal`.
   - Festival calendar (`src/lib/festivals.ts`) — static map of Indian festivals with date windows; picks the next one within 30 days.
   - Recently-viewed tracked in a signed cookie (`giftty_recent`, last 20 slugs, no PII).
   - `src/routes/index.tsx` renders these sections above existing content; falls back to current static rails if AI unavailable.

7. **Admin AI controls** (`/admin.settings` → new "AI" tab)
   - Toggle features (assistant, builder, greeting, ai-search, homepage-personalization).
   - Edit system prompts per feature (stored in new `ai_settings` table, one row).
   - Featured festivals override list.
   - Read-only AI request log viewer (last 100).

8. **Guardrails & UX**
   - All AI outputs are strict JSON via prompt + `try/catch` fallback. Invalid outputs → graceful empty state + retry.
   - Every recommended slug is filtered by `findProductBySlug` for stock/visibility before response.
   - Loading skeletons, error states, "AI temporarily unavailable" fallbacks (route still renders).
   - Rate limit response surfaces a friendly toast.

## Technical details

- **Model**: `google/gemini-3-flash-preview` (default). Uses `LOVABLE_API_KEY` already in env. If missing, `ai_gateway--create` provisions it.
- **Provider**: reuses the pattern from `ai-sdk-lovable-gateway` knowledge — `createOpenAICompatible` with `baseURL: https://ai.gateway.lovable.dev/v1` and `Lovable-API-Key` header. No AI SDK streaming for this drop — all calls are `generateText` with JSON output (simpler + cacheable). Chat-style streaming can come later.
- **DB migration**: `0004_ai.sql` adds `ai_request_logs` and `ai_settings` tables with grants + RLS-off (server-role only access via drizzle).
- **New files** (~20):
  - `src/server/services/ai-gateway.service.ts`, `ai-context.service.ts`, `ai-recommend.service.ts`, `ai-greeting.service.ts`, `ai-search.service.ts`, `ai-homepage.service.ts`, `ai-log.service.ts`, `ai-settings.service.ts`
  - `src/lib/ai.functions.ts` (all customer-facing server fns)
  - `src/lib/festivals.ts`, `src/lib/recently-viewed.ts`
  - `src/components/ai/ai-assistant.tsx`, `ai-gift-builder-panel.tsx`, `ai-greeting-button.tsx`, `ai-search-toggle.tsx`, `ai-recommendation-card.tsx`
  - `src/routes/api/ai.recent.ts` (cookie writer for recently-viewed)
- **Edited**:
  - `src/routes/ai-finder.tsx` (real assistant)
  - `src/routes/index.tsx` (dynamic sections)
  - `src/routes/gift-box.tsx` (AI Build panel)
  - `src/routes/search.tsx` (AI toggle)
  - `src/routes/p.$slug.tsx` (record recently-viewed on view + greeting AI button on custom notes)
  - `src/routes/admin.settings.tsx` (AI tab)
  - `src/server/db/schema.ts` (new tables)

## Deferred (not in this drop)

- Per-user embedding-based recall (needs pgvector; catalog is small enough that AI + rules suffice now).
- Streaming assistant responses.
- Multi-turn chat memory (each request is stateless with full context).
- Image generation for greeting cards.
- A/B testing framework for prompts.

## Verification

After build:
1. `/ai-finder` — enter "birthday gift for my wife under 2000" → returns products + ready box + build CTA.
2. `/gift-box` → AI Build → generates a valid box within capacity/weight/budget; user can edit.
3. Product page greeting field → "Generate" → returns editable text.
4. `/search?q=luxury gifts for mom` with AI toggle → returns ranked results with reason chips.
5. `/` → shows upcoming-festival rail (or seasonal fallback) + "For you" if wishlist/recent exist.
6. `/admin/settings` → AI tab → toggle a feature off → that surface hides gracefully.
7. Kill `LOVABLE_API_KEY` → every AI surface shows fallback content, no crashes.

Reply **"Approved, build Phase 7"** and I'll execute in one drop.
