import Link from "next/link";
import type { ProductWithRelations } from "@/types";

import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProductCardProps = {
  product: ProductWithRelations;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0]?.url ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80";

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="h-full overflow-hidden border-white/70 transition-transform duration-200 hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          <img src={image} alt={product.title} className="h-full w-full object-cover" />
        </div>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">{product.category.name}</Badge>
            {product.isFeatured ? <Badge>Featured</Badge> : null}
          </div>
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-xl font-semibold">{product.title}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
            <span className="text-sm text-muted-foreground">{product.seller.displayName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
