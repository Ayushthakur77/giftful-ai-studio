import { z } from "zod";

/**
 * Env validation. Called from server-only boundaries.
 * NEVER import at module top-level of a client-reachable file.
 */
const schema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(8),

  // Optional — adapters throw at call-time if used without being set
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  AI_BASE_URL: z.string().url().optional().default("https://ai.gateway.lovable.dev/v1"),
  AI_API_KEY: z.string().optional(),
  AI_CHAT_MODEL: z.string().optional().default("google/gemini-2.5-flash"),
  AI_EMBED_MODEL: z.string().optional().default("openai/text-embedding-3-small"),

  // Lovable-provisioned; used by AI adapter for dev
  LOVABLE_API_KEY: z.string().optional(),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed. See logs.");
  }
  cached = parsed.data;
  return cached;
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env()[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Environment variable ${String(key)} is not configured`);
  }
  return value as NonNullable<Env[K]>;
}
