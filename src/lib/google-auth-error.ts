import { reportLovableError } from "./lovable-error-reporting";

/**
 * Maps raw Supabase / OAuth errors to a short, user-friendly message,
 * and logs the exact underlying reason (console + Lovable error reporting)
 * so we can diagnose failures without leaking internals to the user.
 */
export function handleGoogleAuthError(
  err: unknown,
  ctx: { flow: "sign-in" | "sign-up" },
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : (() => {
            try {
              return JSON.stringify(err);
            } catch {
              return String(err);
            }
          })();

  // Exact reason in logs (dev console + error tracker)
  // eslint-disable-next-line no-console
  console.error(`[google-oauth:${ctx.flow}] failed:`, err);
  reportLovableError(err instanceof Error ? err : new Error(raw), {
    source: "google_oauth",
    flow: ctx.flow,
    rawMessage: raw,
  });

  const lower = raw.toLowerCase();

  if (lower.includes("missing oauth secret") || lower.includes("unsupported provider")) {
    return "Google sign-in isn't configured yet. Please try email sign-in, or contact support.";
  }
  if (lower.includes("popup") && lower.includes("closed")) {
    return "Google sign-in was cancelled. Please try again.";
  }
  if (lower.includes("popup") && lower.includes("block")) {
    return "Your browser blocked the Google sign-in popup. Please allow popups and retry.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network issue while contacting Google. Check your connection and try again.";
  }
  if (lower.includes("redirect") && lower.includes("uri")) {
    return "Google sign-in is misconfigured for this domain. Please contact support.";
  }
  if (lower.includes("access_denied") || lower.includes("access denied")) {
    return "Google sign-in was denied. Please try again or use email sign-in.";
  }
  if (lower.includes("invalid_client") || lower.includes("invalid client")) {
    return "Google sign-in isn't configured correctly. Please contact support.";
  }
  if (lower.includes("rate") && lower.includes("limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return ctx.flow === "sign-up"
    ? "Couldn't sign up with Google. Please try again or use email sign-up."
    : "Couldn't sign in with Google. Please try again or use email sign-in.";
}
