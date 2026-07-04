/**
 * Runtime AI feature toggles + editable prompts.
 *
 * In-memory for this drop; swap to a `ai_settings` table when persistence
 * is required. Admin UI reads/writes through the exposed helpers.
 */
export type AiFeatureKey =
  | "assistant"
  | "builder"
  | "greeting"
  | "search"
  | "homepage";

export type AiSettings = {
  enabled: Record<AiFeatureKey, boolean>;
  prompts: Record<AiFeatureKey, string>;
  featuredFestivals: string[]; // slugs
};

const DEFAULT_PROMPTS: Record<AiFeatureKey, string> = {
  assistant:
    "You are Giftty's expert gift assistant for the Indian market. Recommend items from the provided catalog only. Respect budget, stock, and box rules. Always return the requested JSON.",
  builder:
    "You are Giftty's gift-box designer. Assemble a gift box that fits the given empty box's capacity, weight, and category rules. Respect the customer's budget. Return strict JSON.",
  greeting:
    "You are Giftty's greeting-card writer. Craft short, personal, culturally-appropriate messages for the Indian audience. Match the requested tone and language.",
  search:
    "You are Giftty's search interpreter. Extract structured filters (keywords, category, priceMax, occasion, recipient) from a natural-language query. Return strict JSON.",
  homepage:
    "You are Giftty's homepage curator. Pick relevant sections and product slugs from the catalog for the current season and upcoming festivals.",
};

const state: AiSettings = {
  enabled: {
    assistant: true,
    builder: true,
    greeting: true,
    search: true,
    homepage: true,
  },
  prompts: { ...DEFAULT_PROMPTS },
  featuredFestivals: [],
};

export function getAiSettings(): AiSettings {
  // Return a shallow copy so callers can't mutate module state.
  return {
    enabled: { ...state.enabled },
    prompts: { ...state.prompts },
    featuredFestivals: [...state.featuredFestivals],
  };
}

export function isEnabled(key: AiFeatureKey): boolean {
  return state.enabled[key];
}

export function getPrompt(key: AiFeatureKey): string {
  return state.prompts[key] || DEFAULT_PROMPTS[key];
}

export function updateAiSettings(patch: Partial<AiSettings>): AiSettings {
  if (patch.enabled) Object.assign(state.enabled, patch.enabled);
  if (patch.prompts) Object.assign(state.prompts, patch.prompts);
  if (patch.featuredFestivals) state.featuredFestivals = [...patch.featuredFestivals];
  return getAiSettings();
}
