import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User, Menu, Package, Gift, Sparkles, ChevronDown, LogOut, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOutFn } from "@/lib/auth.functions";
import { categories as navCategories } from "@/lib/catalog";
import { useCart, useWishlist } from "@/lib/store";



const primaryNav = [
  { to: "/c/personalized", label: "Personalized", icon: Sparkles },
  { to: "/c/flowers", label: "Flowers" },
  { to: "/c/cakes", label: "Cakes" },
  { to: "/c/chocolates", label: "Chocolates" },
  { to: "/c/hampers", label: "Hampers" },
  { to: "/gift-boxes", label: "Gift Boxes", icon: Gift },
  { to: "/gift-box", label: "Build a Box", icon: Gift },
  { to: "/c/corporate", label: "Corporate" },
  { to: "/ai-finder", label: "AI Finder", icon: Sparkles },
] as const;


export function SiteHeader() {
  const { user } = useRouteContext({ from: "__root__" });
  const router = useRouter();
  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const wishlistCount = useWishlist((s) => s.slugs.length);

  async function handleSignOut() {
    await signOutFn({});
    await router.invalidate();
    router.navigate({ to: "/" });
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top row */}
      <div className="container-page flex h-14 items-center gap-3 md:h-16">

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="font-display text-xl font-bold">Giftty</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {primaryNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              <Link to="/account/orders" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">
                Orders
              </Link>
              <Link to="/account/wishlist" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">
                Wishlist
              </Link>
              <Link to="/help" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">
                Help
              </Link>
              <div className="my-2 border-t border-border" />
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground">Signed in as<br /><span className="text-foreground">{user.email}</span></div>
                  <Link to="/account" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">
                    My account
                  </Link>
                  {user.isSuperAdmin && (
                    <Link to="/admin/dashboard" className="rounded-md px-3 py-3 text-sm font-medium text-primary hover:bg-muted">
                      Admin panel
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="rounded-md px-3 py-3 text-left text-sm font-medium hover:bg-muted">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/sign-in" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">
                    Sign in
                  </Link>
                  <Link to="/auth/sign-up" className="rounded-md px-3 py-3 text-sm font-medium text-primary hover:bg-muted">
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>



        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5" aria-label="Giftty home">
          <Gift className="size-6 text-primary" aria-hidden />
          <span className="font-display text-xl font-bold tracking-tight md:text-2xl">Giftty</span>
        </Link>

        {/* Desktop search */}
        <form
          role="search"
          action="/search"
          method="get"
          className="ml-4 hidden flex-1 md:block"
        >
          <label htmlFor="site-search" className="sr-only">
            Search gifts
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search for gifts, flowers, cakes, occasions..."
              className="h-10 rounded-md border-border bg-surface pl-9"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Search"
            className="md:hidden"
          >
            <Link to="/search">
              <Search className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label={`Wishlist (${wishlistCount})`} className="hidden md:inline-flex">
            <Link to="/account/wishlist" className="relative">
              <Heart className="size-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{wishlistCount}</span>
              )}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Orders" className="hidden md:inline-flex">
            <Link to="/account/orders">
              <Package className="size-5" />
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu" className="hidden md:inline-flex">
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.name ?? user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account">My account</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/orders">Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/wishlist">Wishlist</Link></DropdownMenuItem>
                {user.isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="text-primary">
                        <Shield className="mr-2 size-4" />Admin panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 size-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" asChild className="hidden h-9 px-3 text-sm font-medium md:inline-flex">
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild aria-label={`Cart (${cartCount})`}>
            <Link to="/cart" className="relative">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{cartCount}</span>
              )}
              <span className="sr-only">Cart ({cartCount})</span>
            </Link>
          </Button>

        </div>
      </div>

      {/* Category rail — desktop */}
      <div className="hidden border-t border-border bg-background md:block">
        <div className="container-page flex h-11 items-center gap-1 overflow-x-auto hide-scrollbar">
          {primaryNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground lg:flex">
            <ChevronDown className="size-3" aria-hidden />
            <span>Deliver to India</span>
          </div>
        </div>
      </div>

      {/* Mobile category chips */}
      <div className="border-t border-border bg-background md:hidden">
        <div className="flex gap-2 overflow-x-auto px-4 py-2 hide-scrollbar">
          {navCategories.map((c) => (
            <Link
              key={c.slug}
              to="/c/$category"
              params={{ category: c.slug }}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
