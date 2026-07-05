import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function origin(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = origin(request);
        const sb = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const [{ data: products }, { data: categories }] = await Promise.all([
          sb.from("products").select("slug,updated_at").eq("status", "active").limit(5000),
          sb.from("categories").select("slug,updated_at").eq("visible", true).limit(500),
        ]);

        const staticPaths = [
          "/", "/search", "/gift-boxes", "/ai-finder",
          "/recipients", "/relationships",
          "/about", "/contact", "/faq", "/help", "/shipping", "/returns", "/privacy", "/terms",
        ];

        const urls: string[] = [];
        const push = (loc: string, lastmod?: string) => {
          urls.push(`<url><loc>${base}${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0,10)}</lastmod>` : ""}</url>`);
        };
        staticPaths.forEach((p) => push(p));
        (categories ?? []).forEach((c) => push(`/c/${c.slug}`, c.updated_at));
        (products ?? []).forEach((p) => push(`/p/${p.slug}`, p.updated_at));

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
