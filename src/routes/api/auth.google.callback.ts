import { createFileRoute } from "@tanstack/react-router";

const SESSION_COOKIE = "giftty_session";

export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getCookie, setCookie, deleteCookie, getRequestHeader } = await import(
          "@tanstack/react-start/server"
        );
        const { googleOAuthService, OAuthError } = await import(
          "@/server/services/google-oauth.service"
        );

        const url = new URL(request.url);
        const origin = url.origin;

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");

        const savedState = getCookie("g_oauth_state");
        const verifier = getCookie("g_oauth_verifier");
        const savedRedirect = getCookie("g_oauth_redirect") ?? "/account";
        const redirectTarget =
          savedRedirect.startsWith("/") && !savedRedirect.startsWith("//")
            ? savedRedirect
            : "/account";

        // Clear one-shot cookies
        for (const name of ["g_oauth_state", "g_oauth_verifier", "g_oauth_redirect"]) {
          deleteCookie(name, { path: "/" });
        }

        const fail = (msg: string) =>
          new Response(null, {
            status: 302,
            headers: {
              location: `/auth/sign-in?error=${encodeURIComponent(msg)}`,
            },
          });

        if (errorParam) return fail("Google sign-in was cancelled.");
        if (!code || !state || !verifier || !savedState) {
          return fail("Google sign-in session expired. Please try again.");
        }
        if (state !== savedState) return fail("Invalid Google sign-in state.");

        try {
          const { token, expiresAt } = await googleOAuthService.completeCallback({
            code,
            codeVerifier: verifier,
            origin,
            ip:
              getRequestHeader("cf-connecting-ip") ??
              getRequestHeader("x-forwarded-for") ??
              undefined,
            ua: getRequestHeader("user-agent") ?? undefined,
          });

          setCookie(SESSION_COOKIE, token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
          });

          return new Response(null, {
            status: 302,
            headers: { location: redirectTarget },
          });
        } catch (err) {
          const msg =
            err instanceof OAuthError ? err.message : "Google sign-in failed. Please try again.";
          return fail(msg);
        }
      },
    },
  },
});
