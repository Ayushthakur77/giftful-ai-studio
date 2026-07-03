import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        {[
          { label: "Orders (7d)", value: "0" },
          { label: "Revenue (7d)", value: "₹0" },
          { label: "Customers", value: "0" },
          { label: "Products live", value: "0" },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  ),
});
