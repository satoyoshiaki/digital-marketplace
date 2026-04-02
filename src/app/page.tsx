import Link from "next/link";

import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories, getFeaturedProducts } from "@/lib/data";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Digital Goods Marketplace
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl leading-tight sm:text-6xl">
                つくる人の世界観ごと届ける、BOOTHライクなデジタルマーケット。
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                イラスト素材、3Dアセット、テンプレート、音源まで。作品の熱量が伝わる
                クリーンな購入体験を、買い手にも売り手にも。
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/products">作品を探す</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/seller/dashboard">出品を始める</Link>
              </Button>
            </div>
          </div>
          <Card className="border-border/60 bg-secondary/40">
            <CardContent className="space-y-6 p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-3xl font-semibold">{featuredProducts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-3xl font-semibold">{categories.length}</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                ミニマルな導線で、作品の魅力と価格をまっすぐ伝える構成です。ホームから
                そのままカテゴリ回遊と特集導線につなげます。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-6 py-16">
        <SectionHeading
          eyebrow="Featured"
          title="注目のデジタル作品"
          description="新着の特集掲載作品をピックアップしています。"
        />
        {featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <Card>
            <CardContent className="p-8 text-sm text-muted-foreground">
              Featured products are not available yet.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Categories"
          title="カテゴリから探す"
          description="用途や制作ジャンルに合わせて作品を見つけられます。"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`}>
              <Card className="h-full transition-transform duration-200 hover:-translate-y-1">
                <CardContent className="space-y-3 p-6">
                  <h3 className="text-2xl font-semibold">{category.name}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {category.description ?? "Curated digital products in this category."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
