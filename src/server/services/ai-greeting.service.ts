import { aiChat } from "./ai-gateway.service";
import { getPrompt } from "./ai-settings.service";

export type GreetingInput = {
  occasion?: string;
  recipient?: string;
  relationship?: string;
  tone?: string;
  language?: string;
  maxChars?: number;
  userId?: string;
};

export async function generateGreeting(input: GreetingInput): Promise<string> {
  const system = getPrompt("greeting");
  const max = Math.max(40, Math.min(input.maxChars ?? 200, 500));
  const user = [
    `Occasion: ${input.occasion ?? "general"}`,
    `Recipient: ${input.recipient ?? "loved one"}`,
    input.relationship ? `Relationship: ${input.relationship}` : null,
    `Tone: ${input.tone ?? "heartfelt"}`,
    `Language: ${input.language ?? "English"}`,
    `Max length: ${max} characters.`,
    "",
    "Write ONE short greeting message. Plain text only — no quotes, no signature line, no emoji unless the tone is 'funny'. Do not exceed the max length.",
  ].filter(Boolean).join("\n");

  const raw = await aiChat({
    feature: "greeting",
    userId: input.userId,
    temperature: 0.85,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return raw.trim().replace(/^"|"$/g, "").slice(0, max);
}
