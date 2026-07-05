import { useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Grid2x2, LayoutList, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  categories as allCategories,
  occasions as allOccasions,
  recipients as allRecipients,
  type Product,
  type CategorySlug,
  type OccasionSlug,
  type RecipientSlug,
  type SortKey,
} from "@/lib/catalog";
import { searchProductsFn } from "@/lib/discovery.functions";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { PackageSearch } from "lucide-react";


export type BrowserSearch = {
  q?: string;
  category?: CategorySlug;
  occasion?: OccasionSlug;
  recipient?: RecipientSlug;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  discount?: boolean;
  personalizable?: boolean;
  giftBoxCompat?: boolean;
  inStock?: boolean;
  sort?: SortKey;
  view?: "grid" | "list";
  page?: number;
};

const PAGE_SIZE = 12;

export function ShopBrowser({
  search,
  routeFrom,
  lockCategory,
  lockOccasion,
}: {
  search: BrowserSearch;
  routeFrom: string;
  lockCategory?: CategorySlug;
  lockOccasion?: OccasionSlug;
}) {
  const navigate = useNavigate({ from: routeFrom as any }) as unknown as (opts: { search: any }) => void;

  const sort = search.sort ?? "popularity";
  const view = search.view ?? "grid";
  const page = search.page ?? 1;
  const category = lockCategory ?? search.category;
  const occasion = lockOccasion ?? search.occasion;

  const input = {
    q: search.q,
    categorySlug: category,
    occasion,
    recipient: search.recipient,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    discountOnly: search.discount,
    inStockOnly: search.inStock,
    giftBoxOnly: search.giftBoxCompat,
    sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const productsQuery = useQuery({
    queryKey: ["discovery", "search", input],
    queryFn: () => searchProductsFn({ data: input }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const results = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageResults = results;

  function update(patch: Partial<BrowserSearch>) {
    navigate({ search: (prev: BrowserSearch) => ({ ...prev, ...patch, page: 1 }) });
  }




  const filterPanel = (
    <FilterPanel
      search={search}
      lockCategory={lockCategory}
      lockOccasion={lockOccasion}
      onChange={update}
      onReset={() =>
        navigate({
          search: {
            q: search.q,
            sort: search.sort,
            view: search.view,
          } as BrowserSearch,
        })
      }
    />
  );

  return (
    <div className="container-page grid gap-6 py-6 md:grid-cols-[260px_1fr] md:py-10">
      <aside className="hidden md:block">{filterPanel}</aside>

      <div>
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "product" : "products"}
          </p>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <SlidersHorizontal className="mr-1.5 size-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto p-4">
                <SheetHeader className="mb-4"><SheetTitle>Filters</SheetTitle></SheetHeader>
                {filterPanel}
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={(v) => update({ sort: v as SortKey })}>
              <SelectTrigger className="h-9 w-[180px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-desc">Price: High → Low</SelectItem>
                <SelectItem value="rating">Best rated</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
              </SelectContent>
            </Select>

            <div className="inline-flex rounded-md border border-border">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                aria-label="Grid view"
                className="h-9 w-9 rounded-r-none"
                onClick={() => navigate({ search: (p: BrowserSearch) => ({ ...p, view: "grid" }) })}
              >
                <Grid2x2 className="size-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                aria-label="List view"
                className="h-9 w-9 rounded-l-none"
                onClick={() => navigate({ search: (p: BrowserSearch) => ({ ...p, view: "list" }) })}
              >
                <LayoutList className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {pageResults.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products match those filters"
            description="Try broadening your search or removing a filter."
          />
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4"
                : "grid grid-cols-1 gap-3"
            }
          >
            {pageResults.map((p: Product) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ search: (p: BrowserSearch) => ({ ...p, page: (p.page ?? 1) - 1 }) })}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ search: (p: BrowserSearch) => ({ ...p, page: (p.page ?? 1) + 1 }) })}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPanel({
  search,
  lockCategory,
  lockOccasion,
  onChange,
  onReset,
}: {
  search: BrowserSearch;
  lockCategory?: CategorySlug;
  lockOccasion?: OccasionSlug;
  onChange: (patch: Partial<BrowserSearch>) => void;
  onReset: () => void;
}) {
  const min = 0;
  const max = 500000; // 5000 rupees
  const priceRange = [search.minPrice ?? min, search.maxPrice ?? max] as [number, number];
  return (
    <div className="flex flex-col gap-6 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onReset}>
          Reset
        </Button>
      </div>

      {!lockCategory && (
        <FilterGroup title="Category">
          <RadioGroup
            value={search.category ?? ""}
            onValueChange={(v) => onChange({ category: (v || undefined) as CategorySlug | undefined })}
            className="grid gap-1.5"
          >
            <RadioLine value="" label="All categories" name="cat" />
            {allCategories.map((c) => <RadioLine key={c.slug} value={c.slug} label={c.name} name="cat" />)}
          </RadioGroup>
        </FilterGroup>
      )}

      {!lockOccasion && (
        <FilterGroup title="Occasion">
          <RadioGroup
            value={search.occasion ?? ""}
            onValueChange={(v) => onChange({ occasion: (v || undefined) as OccasionSlug | undefined })}
            className="grid gap-1.5"
          >
            <RadioLine value="" label="Any occasion" name="occ" />
            {allOccasions.map((o) => <RadioLine key={o.slug} value={o.slug} label={o.name} name="occ" />)}
          </RadioGroup>
        </FilterGroup>
      )}

      <FilterGroup title="Recipient">
        <RadioGroup
          value={search.recipient ?? ""}
          onValueChange={(v) => onChange({ recipient: (v || undefined) as RecipientSlug | undefined })}
          className="grid gap-1.5"
        >
          <RadioLine value="" label="Any recipient" name="rcp" />
          {allRecipients.map((r) => <RadioLine key={r.slug} value={r.slug} label={r.name} name="rcp" />)}
        </RadioGroup>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="px-1">
          <Slider
            min={min}
            max={max}
            step={5000}
            value={priceRange}
            onValueChange={(v) => onChange({ minPrice: v[0], maxPrice: v[1] })}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground price-num">
            <span>₹{Math.round(priceRange[0] / 100).toLocaleString("en-IN")}</span>
            <span>₹{Math.round(priceRange[1] / 100).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <RadioGroup
          value={search.minRating != null ? String(search.minRating) : ""}
          onValueChange={(v) => onChange({ minRating: v ? Number(v) : undefined })}
          className="grid gap-1.5"
        >
          <RadioLine value="" label="Any rating" name="rate" />
          <RadioLine value="4" label="4★ & up" name="rate" />
          <RadioLine value="3" label="3★ & up" name="rate" />
        </RadioGroup>
      </FilterGroup>

      <FilterGroup title="Other">
        <div className="grid gap-2">
          <CheckLine
            id="fdiscount"
            checked={!!search.discount}
            onChange={(v) => onChange({ discount: v || undefined })}
            label="On discount"
          />
          <CheckLine
            id="fpers"
            checked={!!search.personalizable}
            onChange={(v) => onChange({ personalizable: v || undefined })}
            label="Personalizable"
          />
          <CheckLine
            id="fbox"
            checked={!!search.giftBoxCompat}
            onChange={(v) => onChange({ giftBoxCompat: v || undefined })}
            label="Gift-box compatible"
          />
          <CheckLine
            id="fstock"
            checked={!!search.inStock}
            onChange={(v) => onChange({ inStock: v || undefined })}
            label="In stock only"
          />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function RadioLine({ value, label, name }: { value: string; label: string; name: string }) {
  const id = `${name}-${value || "any"}`;
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
    </div>
  );
}

function CheckLine({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
    </div>
  );
}

type Filters = {
  q?: string;
  category?: CategorySlug;
  occasion?: OccasionSlug;
  recipient?: RecipientSlug;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  discountOnly?: boolean;
  personalizableOnly?: boolean;
  giftBoxCompatibleOnly?: boolean;
  inStockOnly?: boolean;
};

function applyFilters(items: Product[], f: Filters, sort: SortKey): Product[] {
  const q = f.q?.trim().toLowerCase();
  let out = items.filter((p) => {
    if (f.category && p.category !== f.category) return false;
    if (f.occasion && !p.occasions.includes(f.occasion)) return false;
    if (f.recipient && !p.recipients.includes(f.recipient)) return false;
    if (f.minPrice != null && p.pricePaise < f.minPrice) return false;
    if (f.maxPrice != null && p.pricePaise > f.maxPrice) return false;
    if (f.minRating != null && p.rating < f.minRating) return false;
    if (f.inStockOnly && p.stock <= 0) return false;
    if (f.personalizableOnly && !p.isPersonalizable) return false;
    if (f.giftBoxCompatibleOnly && !p.isGiftBoxCompatible) return false;
    if (f.discountOnly && !(p.mrpPaise && p.mrpPaise > p.pricePaise)) return false;
    if (q) {
      const hay = `${p.name} ${p.shortDescription} ${p.description} ${p.category} ${(p.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  switch (sort) {
    case "price-asc": out.sort((a, b) => a.pricePaise - b.pricePaise); break;
    case "price-desc": out.sort((a, b) => b.pricePaise - a.pricePaise); break;
    case "rating": out.sort((a, b) => b.rating - a.rating); break;
    case "discount": out.sort((a, b) => discountPct(b) - discountPct(a)); break;
    case "newest": out = [...out].reverse(); break;
    default: out.sort((a, b) => b.ratingCount - a.ratingCount);
  }
  return out;
}
