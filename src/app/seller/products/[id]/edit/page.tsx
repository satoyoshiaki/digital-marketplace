import { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";

import { SellerProductEditor } from "@/components/seller-product-editor";
import { requireSeller } from "@/lib/auth";
import { getCategories, getProductById } from "@/lib/data";

type EditSellerProductPageProps = {
  params: {
    id: string;
  };
};

export default async function EditSellerProductPage({
  params,
}: EditSellerProductPageProps) {
  const [user, categories, product] = await Promise.all([
    requireSeller(),
    getCategories(),
    getProductById(params.id),
  ]);

  if (!product) {
    notFound();
  }

  if (user.role !== UserRole.ADMIN && product.sellerId !== user.sellerProfileId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <SellerProductEditor
        categories={categories}
        product={{
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          categoryId: product.categoryId,
          status: product.status,
          isFeatured: product.isFeatured,
          images: product.images,
          files: product.files,
        }}
      />
    </div>
  );
}
