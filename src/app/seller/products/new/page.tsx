"use client";

import { useEffect, useState } from "react";
import type { Category } from "@prisma/client";

import { SellerProductEditor } from "@/components/seller-product-editor";
import { Card, CardContent } from "@/components/ui/card";

export default function NewSellerProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/products");
        const body = (await response.json()) as { categories?: Category[]; error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load categories");
        }

        setCategories(body.categories ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load categories");
      }
    }

    void loadCategories();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-14">
      {error ? (
        <Card>
          <CardContent className="p-8 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : categories.length > 0 ? (
        <SellerProductEditor categories={categories} />
      ) : (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Loading product editor...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
