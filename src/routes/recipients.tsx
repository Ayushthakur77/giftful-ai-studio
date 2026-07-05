import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicRecipientsFn } from "@/lib/taxonomy.functions";

const CANON = "https://giftful-ai-studio.lovable.app";

const qo = queryOptions({
  queryKey: ["public-recipients"],
  queryFn: () => listPublicRecipientsFn(),
});

export const Route = createFileRoute("/recipients")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  head: () => ({
    meta: [
      { title: "Shop by Recipient — Giftty" },
      { name: "description", content: "Find the perfect gift for him, her, kids, parents, couples and colleagues." },
      { property: "og:title", content: "Shop by Recipient — Giftty" },
      { property: "og:url", content: `${CANON}/recipients` },
    ],
    links: [{ rel: "canonical", href: `${CANON}/recipients` }],
  }),
  component: RecipientsIndex,
});

function RecipientsIndex() {
  const { data } = useSuspenseQuery(qo);
  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Shop by Recipient</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Who are you gifting to?</h1>
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.map((r) => (
          <Link
            key={r.id}
            to="/r/$recipient"
            params={{ recipient: r.slug }}
            className="group overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:shadow-md"
          >
            {r.image_url && (
              <img src={r.image_url} alt={r.name} loading="lazy" className="mb-4 h-32 w-full rounded-lg object-cover" />
            )}
            <h2 className="font-display text-xl font-semibold group-hover:text-primary">{r.name}</h2>
            {r.tagline && <p className="mt-1 text-sm text-muted-foreground">{r.tagline}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
