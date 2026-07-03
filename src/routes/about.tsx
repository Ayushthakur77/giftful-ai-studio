import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Giftty" }, { name: "description", content: "India's thoughtful gifting destination." }] }),
  component: () => <PagePlaceholder title="About Giftty" description="Our story, mission and craft." />,
});
