import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-giftbox.jpg";
import boxBuilderImg from "@/assets/box-builder.jpg";
import productFlowers from "@/assets/product-flowers.jpg";
import productFrame from "@/assets/product-frame.jpg";
import productCake from "@/assets/product-cake.jpg";
import productDryfruit from "@/assets/product-dryfruit.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Giftty — Thoughtful Gifting, Delivered Across India" },
      {
        name: "description",
        content:
          "Personalized gifts, curated gift boxes, flowers, cakes and corporate hampers. Same-day & midnight delivery in 100+ Indian cities. Build your own box or let AI pick the perfect gift.",
      },
      { property: "og:title", content: "Giftty — Thoughtful Gifting, Delivered Across India" },
      {
        property: "og:description",
        content:
          "Personalized gifts, gift boxes, flowers and cakes with same-day delivery across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const occasions = [
  { name: "Birthday", tone: "bg-soft" },
  { name: "Anniversary", tone: "bg-muted" },
  { name: "Wedding", tone: "bg-soft" },
  { name: "Rakhi", tone: "bg-brand text-brand-foreground" },
  { name: "Diwali", tone: "bg-muted" },
  { name: "Corporate", tone: "bg-soft" },
];

const products = [
  { name: "Blush & Bloom Bouquet", price: "₹1,499", badge: "Same Day", img: productFlowers },
  { name: "Eternal Frame Keepsake", price: "₹899", badge: "Personalized", img: productFrame },
  { name: "Midnight Belgian Truffle", price: "₹1,199", badge: "Midnight", img: productCake },
  { name: "Imperial Dry Fruit Casket", price: "₹2,499", badge: "Festival", img: productDryfruit },
];

const recipients = ["For Him", "For Her", "For Kids", "Parents"];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Delivery Strip */}
      <div className="bg-brand text-brand-foreground py-2 px-4 text-center text-xs font-medium tracking-wide uppercase">
        <span className="mx-4 italic">Same Day Delivery in 100+ Cities</span>
        <span className="hidden md:inline opacity-60">•</span>
        <span className="mx-4 hidden md:inline">Midnight Surprise Guaranteed</span>
        <span className="hidden md:inline opacity-60">•</span>
        <span className="mx-4 hidden md:inline">Pan-India Gifting Network</span>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-serif text-2xl font-black tracking-tighter">GIFTTY.</div>
          <div className="hidden lg:flex space-x-8 text-sm font-medium">
            <a href="#occasions" className="hover:text-gold transition-colors">Occasions</a>
            <a href="#builder" className="hover:text-gold transition-colors">Gift Boxes</a>
            <a href="#trending" className="hover:text-gold transition-colors">Personalized</a>
            <a href="#" className="hover:text-gold transition-colors">Flowers & Cakes</a>
            <a href="#" className="hover:text-gold transition-colors">Corporate</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs bg-soft px-3 py-1.5 rounded-full border border-border">
              📍 Delivering to Mumbai
            </div>
            <button className="text-sm font-medium hover:text-gold transition-colors" aria-label="Account">Sign in</button>
            <button className="relative text-sm font-medium bg-brand text-brand-foreground px-4 py-1.5 rounded-full hover:bg-gold hover:text-brand transition-colors" aria-label="Cart">
              Cart <span className="ml-1 opacity-70">(0)</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <section className="py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block uppercase tracking-[0.3em] text-xs font-semibold text-gold mb-6">
                India's Gifting Boutique
              </span>
              <h1 className="text-5xl md:text-7xl leading-[1.05] mb-6 text-balance">
                Thoughtful Gifting,{" "}
                <span className="italic text-gold">Redefined.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                From personalized keepsakes to same-day cakes, find the perfect
                gesture for every Indian celebration.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#trending" className="bg-brand text-brand-foreground px-8 py-4 rounded-full font-semibold hover:scale-[1.02] transition-transform shadow-elegant">
                  Shop Bestsellers
                </a>
                <a href="#builder" className="border border-border px-8 py-4 rounded-full font-semibold hover:bg-soft transition-colors">
                  Build a Gift Box
                </a>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImg}
                alt="Curated Giftty gift box with chocolates, flowers and a handwritten card"
                width={1200}
                height={1200}
                className="w-full aspect-square object-cover rounded-3xl shadow-elegant"
              />
              <div className="absolute -bottom-6 -left-6 bg-gold text-brand p-5 rounded-2xl shadow-warm max-w-[220px]">
                <p className="text-sm font-bold">Next Occasion: Rakhi</p>
                <p className="text-xs mt-1 opacity-80">Order by Aug 15 for guaranteed delivery</p>
              </div>
            </div>
          </div>
        </section>

        {/* Occasions */}
        <section id="occasions" className="py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Browse</span>
              <h2 className="text-3xl md:text-4xl mt-2">Shop by Occasion</h2>
            </div>
            <a href="#" className="text-sm font-semibold underline underline-offset-4 hover:text-gold transition-colors">
              View All
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {occasions.map((o) => (
              <a
                key={o.name}
                href="#"
                className={`group aspect-[4/5] rounded-2xl overflow-hidden border border-border flex flex-col justify-end p-4 hover:shadow-warm transition-shadow ${o.tone}`}
              >
                <div className="flex-1 grid place-items-center">
                  <div className="size-14 rounded-full bg-gold/30 group-hover:scale-110 transition-transform" />
                </div>
                <p className="font-medium text-sm text-center">{o.name}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Gift Box Builder */}
        <section id="builder" className="py-16">
          <div className="bg-brand text-brand-foreground rounded-[32px] overflow-hidden grid lg:grid-cols-2">
            <div className="p-10 md:p-16 flex flex-col justify-center">
              <span className="uppercase tracking-[0.3em] text-xs font-bold text-gold mb-4">
                Personalized Experience
              </span>
              <h2 className="text-4xl md:text-5xl mb-6 text-brand-foreground">
                Build Your Own Gift Box
              </h2>
              <p className="opacity-75 mb-8 text-lg max-w-md">
                Pick a box, select hand-picked treasures, and let us add the
                finishing touch with a handwritten note.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <a href="#" className="bg-gold text-brand px-8 py-4 rounded-full font-bold hover:brightness-105 transition">
                  Start Building
                </a>
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <span className="size-2 bg-gold rounded-full animate-pulse" />
                  <span>AI Gift Finder Available</span>
                </div>
              </div>
            </div>
            <div className="min-h-[320px] relative">
              <img
                src={boxBuilderImg}
                alt="Hands arranging items inside a Giftty box builder"
                loading="lazy"
                width={1000}
                height={800}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section id="trending" className="py-16">
          <div className="mb-10">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Trending</span>
            <h2 className="text-3xl md:text-4xl mt-2">Most Loved This Week</h2>
            <p className="text-muted-foreground mt-2">Hand-picked bestsellers across India.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <a key={p.name} href="#" className="group">
                <div className="relative mb-4 rounded-2xl overflow-hidden bg-soft aspect-[3/4]">
                  <img
                    src={p.img}
                    alt={p.name}
                    loading="lazy"
                    width={600}
                    height={800}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {p.badge}
                  </div>
                </div>
                <h3 className="font-medium group-hover:text-gold transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.price}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Recipients */}
        <section className="py-16">
          <div className="bg-brand text-brand-foreground rounded-[32px] px-8 py-16">
            <h2 className="text-3xl md:text-4xl text-center mb-12 text-brand-foreground">
              Who are you celebrating?
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {recipients.map((r) => (
                <a
                  key={r}
                  href="#"
                  className="aspect-square rounded-full bg-brand-foreground/5 border border-brand-foreground/15 flex items-center justify-center hover:bg-gold hover:text-brand hover:border-gold transition-all cursor-pointer"
                >
                  <span className="text-lg font-serif italic">{r}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-gold text-2xl mb-6 tracking-widest">★★★★★</div>
            <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-8 text-balance">
              "Giftty saved my sister's birthday. The personalized box arrived
              in Bangalore within 4 hours, and the engraving was exquisite.
              Best gifting experience in India."
            </blockquote>
            <p className="font-bold uppercase tracking-widest text-xs">
              Ananya Sharma, Mumbai
            </p>
          </div>
        </section>
      </main>

      {/* AI Chat FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-gold text-brand px-5 py-3 rounded-2xl shadow-warm flex items-center gap-3 hover:scale-105 transition-transform">
          <span className="size-8 bg-brand/10 rounded-full grid place-items-center">
            <span className="size-3 bg-brand rounded-full animate-pulse" />
          </span>
          <span className="text-left">
            <span className="block text-[10px] font-bold uppercase opacity-70">Stuck for ideas?</span>
            <span className="block text-sm font-bold">Ask AI Gift Finder</span>
          </span>
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-soft mt-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="font-serif text-2xl font-black mb-4">GIFTTY.</div>
            <p className="text-muted-foreground max-w-sm">
              India's premium destination for gifting joy. Hand-picked,
              personalized, and delivered with love across the subcontinent.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-gold">About Us</a></li>
              <li><a href="#" className="hover:text-gold">Corporate Gifting</a></li>
              <li><a href="#" className="hover:text-gold">Digital Gift Cards</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-gold">Track Order</a></li>
              <li><a href="#" className="hover:text-gold">Delivery Policy</a></li>
              <li><a href="#" className="hover:text-gold">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          <p>© 2024 Giftty Retail Pvt Ltd.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
