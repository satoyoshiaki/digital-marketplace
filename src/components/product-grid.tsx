import type { ProductWithRelations } from "@/types";

import { ProductCard } from "@/components/product-card";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
