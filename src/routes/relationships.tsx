import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicRelationshipsFn } from "@/lib/taxonomy.functions";

const CANON = "https://giftful-ai-studio.lovable.app";

const qo = queryOptions({
  queryKey: ["public-relationships"],
  queryFn: () => listPublicRelationshipsFn(),
});

export const Route = createFileRoute("/relationships")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  head: () => ({
    meta: [
      { title: "Shop by Relationship — Giftty" },
      { name: "description", content: "Gifts curated for the people who matter — wife, husband, mother, father, siblings, friends and more." },
      { property: "og:title", content: "Shop by Relationship — Giftty" },
      { property: "og:url", content: `${CANON}/relationships` },
    ],
    links: [{ rel: "canonical", href: `${CANON}/relationships` }],
  }),
  component: RelationshipsIndex,
});

function RelationshipsIndex() {
  const { data } = useSuspenseQuery(qo);
  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Shop by Relationship</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Gifts for every relationship</h1>
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.map((r) => (
          <Link
            key={r.id}
            to="/rel/$relationship"
            params={{ relationship: r.slug }}
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
