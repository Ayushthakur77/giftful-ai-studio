import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/feedback/empty-state";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/account/addresses")({
  component: () => (
    <EmptyState icon={MapPin} title="No addresses saved" description="Add a delivery address for faster checkout." />
  ),
});
