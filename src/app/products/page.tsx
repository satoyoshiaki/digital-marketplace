import Link from "next/link";

import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories, getProducts } from "@/lib/data";

const PAGE_SIZE = 9;

type ProductsPageProps = {
  searchParams?: {
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  };
};

function sortProducts(
  products: Awaited<ReturnType<typeof getProducts>>,
  sort: string,
) {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "popular":
      sorted.sort(
        (a, b) => (b._count?.orderItems ?? 0) - (a._count?.orderItems ?? 0),
      );
      break;
    default:
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }

  return sorted;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const category = searchParams?.category?.trim() ?? "";
  const sort = searchParams?.sort?.trim() ?? "newest";
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);

  const [categories, rawProducts] = await Promise.all([
    getCategories(),
    getProducts({
      search: query || undefined,
      category: category || undefined,
    }),
  ]);

  const products = sortProducts(rawProducts, sort);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = products.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (sort && sort !== "newest") params.set("sort", sort);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-14">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Products
        </p>
        <h1 className="text-5xl">デジタル作品一覧</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          キーワード、カテゴリ、価格順で探せます。
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <label htmlFor="q" className="text-sm font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={query}
                placeholder="タイトル、説明、クリエイター名"
                className="h-12 w-full rounded-2xl border border-input bg-white px-4"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sort" className="text-sm font-medium">
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className="h-12 w-full rounded-2xl border border-input bg-white px-4"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
              </select>
            </div>
            <input type="hidden" name="category" value={category} />
            <Button type="submit" className="h-12">
              Filter
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/products${query ? `?q=${encodeURIComponent(query)}` : ""}`}>
              <Button variant={category ? "outline" : "default"} size="sm">
                All
              </Button>
            </Link>
            {categories.map((item) => {
              const next = new URLSearchParams();
              if (query) next.set("q", query);
              next.set("category", item.slug);
              if (sort !== "newest") next.set("sort", sort);

              return (
                <Link key={item.id} href={`/products?${next.toString()}`}>
                  <Button
                    variant={category === item.slug ? "default" : "outline"}
                    size="sm"
                  >
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {paginatedProducts.length > 0 ? (
        <ProductGrid products={paginatedProducts} />
      ) : (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            No products matched your filters.
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Page {safePage} / {totalPages}
        </p>
        <div className="flex gap-3">
          {safePage > 1 ? (
            <Link
              href={`/products?${(() => {
                const previous = new URLSearchParams(params);
                previous.set("page", String(safePage - 1));
                return previous.toString();
              })()}`}
            >
              <Button variant="outline">Previous</Button>
            </Link>
          ) : null}
          {safePage < totalPages ? (
            <Link
              href={`/products?${(() => {
                const next = new URLSearchParams(params);
                next.set("page", String(safePage + 1));
                return next.toString();
              })()}`}
            >
              <Button variant="outline">Next</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
