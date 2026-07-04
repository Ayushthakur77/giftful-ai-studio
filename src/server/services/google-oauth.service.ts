import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { accounts, auditLogs, users, userRoles } from "../db/schema";
import { env } from "../env";
import { createSession } from "../lib/session";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export class OAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthError";
  }
}

function requireGoogleEnv() {
  const clientId = env().GOOGLE_CLIENT_ID;
  const clientSecret = env().GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new OAuthError("Google sign-in is not configured on the server.");
  }
  return { clientId, clientSecret };
}

export function buildRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function newOAuthState() {
  return randomBytes(16).toString("hex");
}

export function newPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildAuthorizeUrl(params: {
  origin: string;
  state: string;
  codeChallenge: string;
  redirectAfter: string;
}) {
  const { clientId } = requireGoogleEnv();
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", buildRedirectUri(params.origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

async function exchangeCode(params: {
  code: string;
  codeVerifier: string;
  origin: string;
}) {
  const { clientId, clientSecret } = requireGoogleEnv();
  const body = new URLSearchParams({
    code: params.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: buildRedirectUri(params.origin),
    grant_type: "authorization_code",
    code_verifier: params.codeVerifier,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new OAuthError("Failed to exchange Google authorization code.");
  }
  return (await res.json()) as {
    access_token: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };
}

async function fetchUserInfo(accessToken: string) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new OAuthError("Failed to fetch Google profile.");
  return (await res.json()) as {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
}

async function upsertGoogleUser(profile: {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}) {
  const email = profile.email.trim().toLowerCase();

  // 1) Existing linked account?
  const [linked] = await db()
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(and(eq(accounts.provider, "google"), eq(accounts.providerAccountId, profile.sub)))
    .limit(1);
  if (linked) return linked.userId;

  // 2) Existing user with same email — link.
  const [existing] = await db()
    .select({ id: users.id, disabledAt: users.disabledAt, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;
  if (existing) {
    if (existing.disabledAt || existing.deletedAt) {
      throw new OAuthError("This account is not available.");
    }
    userId = existing.id;
    // Backfill avatar/name if missing
    await db()
      .update(users)
      .set({
        avatarUrl: profile.picture ?? undefined,
        name: profile.name ?? undefined,
        emailVerifiedAt: profile.emailVerified ? new Date() : undefined,
      })
      .where(eq(users.id, userId));
  } else {
    const [created] = await db()
      .insert(users)
      .values({
        email,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
      })
      .returning({ id: users.id });
    userId = created.id;
    await db().insert(userRoles).values({ userId, role: "customer" });
  }

  await db().insert(accounts).values({
    userId,
    provider: "google",
    providerAccountId: profile.sub,
  });

  return userId;
}

export const googleOAuthService = {
  buildAuthorizeUrl,
  newOAuthState,
  newPkce,

  async completeCallback(params: {
    code: string;
    codeVerifier: string;
    origin: string;
    ip?: string;
    ua?: string;
  }) {
    const tokens = await exchangeCode({
      code: params.code,
      codeVerifier: params.codeVerifier,
      origin: params.origin,
    });
    const profile = await fetchUserInfo(tokens.access_token);
    if (!profile.email) throw new OAuthError("Google account has no email.");

    const userId = await upsertGoogleUser({
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      emailVerified: profile.email_verified,
    });

    await db().insert(auditLogs).values({
      actorId: userId,
      action: "auth.google",
      entityType: "user",
      entityId: userId,
      ip: params.ip,
      userAgent: params.ua,
    });

    const { token, expiresAt } = await createSession(userId, { ip: params.ip, ua: params.ua });
    return { userId, token, expiresAt };
  },
};
