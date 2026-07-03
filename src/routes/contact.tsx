import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Giftty" }, { name: "description", content: "Get in touch with the Giftty team." }] }),
  component: () => <PagePlaceholder title="Contact us" description="Reach us over email or phone." />,
});
