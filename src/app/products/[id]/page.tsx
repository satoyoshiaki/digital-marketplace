import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getProductById } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type ProductDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const [product, currentUser] = await Promise.all([
    getProductById(params.id),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  const hasPurchased = currentUser
    ? await prisma.download.findFirst({
        where: {
          userId: currentUser.id,
          productId: product.id,
        },
      })
    : null;

  const heroImage =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[32px] border bg-secondary/30">
            <img
              src={heroImage}
              alt={product.images[0]?.altText ?? product.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border bg-secondary/20">
                  <img
                    src={image.url}
                    alt={image.altText ?? product.title}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge>{product.category.name}</Badge>
              {product.isFeatured ? <Badge variant="secondary">Featured</Badge> : null}
            </div>
            <h1 className="text-5xl leading-tight">{product.title}</h1>
            <p className="text-3xl font-semibold">{formatPrice(product.price)}</p>
            <p className="text-base leading-8 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seller</p>
                  <p className="text-lg font-semibold">{product.seller.displayName}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {product._count?.orderItems ?? 0} sales
                </p>
              </div>
              <AddToCartButton productId={product.id} />
              {hasPurchased ? (
                <Link
                  href={`/api/downloads/${hasPurchased.orderId}?productId=${product.id}`}
                  className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  購入済みコンテンツをダウンロード
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
