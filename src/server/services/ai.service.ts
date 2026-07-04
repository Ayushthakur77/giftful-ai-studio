import { env } from "../env";

/**
 * OpenAI-compatible chat/embed interface. Swap providers with 3 env vars.
 * Dev default: Lovable AI Gateway with LOVABLE_API_KEY.
 */
export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIService {
  chat(input: { messages: AIChatMessage[]; model?: string; temperature?: number }): Promise<{ content: string }>;
  embed(input: { texts: string[]; model?: string }): Promise<{ vectors: number[][] }>;
}

function apiKey(): string {
  const key = env().AI_API_KEY ?? env().LOVABLE_API_KEY;
  if (!key) throw new Error("AI provider is not configured. Set AI_API_KEY or LOVABLE_API_KEY.");
  return key;
}

export const aiService: AIService = {
  async chat({ messages, model, temperature }) {
    const res = await fetch(`${env().AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model: model ?? env().AI_CHAT_MODEL,
        messages,
        temperature: temperature ?? 0.7,
      }),
    });
    if (!res.ok) throw new Error(`AI chat failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    return { content: json.choices[0]?.message?.content ?? "" };
  },
  async embed({ texts, model }) {
    const res = await fetch(`${env().AI_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({ model: model ?? env().AI_EMBED_MODEL, input: texts }),
    });
    if (!res.ok) throw new Error(`AI embed failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return { vectors: json.data.map((d) => d.embedding) };
  },
};
