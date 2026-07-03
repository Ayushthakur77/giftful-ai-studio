import { Link } from "@tanstack/react-router";
import { Gift, Instagram, Facebook, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const columns = [
  {
    title: "Shop",
    links: [
      { to: "/c/personalized", label: "Personalized Gifts" },
      { to: "/c/flowers", label: "Flowers" },
      { to: "/c/cakes", label: "Cakes" },
      { to: "/c/hampers", label: "Gift Hampers" },
      { to: "/c/corporate", label: "Corporate Gifts" },
      { to: "/gift-box", label: "Build Your Box" },
    ],
  },
  {
    title: "Help",
    links: [
      { to: "/contact", label: "Contact us" },
      { to: "/faq", label: "FAQ" },
      { to: "/shipping", label: "Shipping" },
      { to: "/returns", label: "Returns" },
      { to: "/account/orders", label: "Track order" },
      { to: "/help", label: "Help center" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About us" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy policy" },
      { to: "/terms", label: "Terms of service" },
      { to: "/returns", label: "Refund policy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-1.5" aria-label="Giftty">
              <Gift className="size-6 text-primary" aria-hidden />
              <span className="font-display text-xl font-bold">Giftty</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Thoughtful gifting, delivered across India.
            </p>
            <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="newsletter" className="sr-only">Email for newsletter</label>
              <Input id="newsletter" type="email" placeholder="Your email" className="h-10" />
              <Button type="submit" className="h-10">Join</Button>
            </form>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-4 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Giftty. Made in India.</p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Secure payments · Visa · Mastercard · UPI · Razorpay</span>
            <div className="flex gap-2">
              <a href="#" aria-label="Instagram" className="hover:text-foreground"><Instagram className="size-4" /></a>
              <a href="#" aria-label="Facebook" className="hover:text-foreground"><Facebook className="size-4" /></a>
              <a href="#" aria-label="YouTube" className="hover:text-foreground"><Youtube className="size-4" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
