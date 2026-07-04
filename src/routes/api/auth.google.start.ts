import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/google/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { setCookie } = await import("@tanstack/react-start/server");
        const { googleOAuthService, OAuthError } = await import(
          "@/server/services/google-oauth.service"
        );

        const url = new URL(request.url);
        const origin = url.origin;
        const redirectAfterRaw = url.searchParams.get("redirect") ?? "/account";
        const redirectAfter =
          redirectAfterRaw.startsWith("/") && !redirectAfterRaw.startsWith("//")
            ? redirectAfterRaw
            : "/account";

        try {
          const state = googleOAuthService.newOAuthState();
          const { verifier, challenge } = googleOAuthService.newPkce();

          const cookieOpts = {
            httpOnly: true,
            secure: true,
            sameSite: "lax" as const,
            path: "/",
            maxAge: 10 * 60, // 10 minutes
          };
          setCookie("g_oauth_state", state, cookieOpts);
          setCookie("g_oauth_verifier", verifier, cookieOpts);
          setCookie("g_oauth_redirect", redirectAfter, cookieOpts);

          const authorizeUrl = googleOAuthService.buildAuthorizeUrl({
            origin,
            state,
            codeChallenge: challenge,
            redirectAfter,
          });

          return new Response(null, {
            status: 302,
            headers: { location: authorizeUrl },
          });
        } catch (err) {
          const msg = err instanceof OAuthError ? err.message : "Google sign-in failed to start.";
          return new Response(null, {
            status: 302,
            headers: {
              location: `/auth/sign-in?error=${encodeURIComponent(msg)}`,
            },
          });
        }
      },
    },
  },
});
