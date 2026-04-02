"use client";

import { useEffect, useState } from "react";

import { CartClient } from "@/components/cart-client";
import { Card, CardContent } from "@/components/ui/card";

type CartResponse = {
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      title: string;
      price: number;
      images: Array<{ url: string }>;
    };
  }>;
  error?: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartResponse["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const body = (await response.json()) as CartResponse;

        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load cart");
        }

        setItems(body.items);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load cart");
      } finally {
        setLoading(false);
      }
    }

    void loadCart();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Cart
        </p>
        <h1 className="text-5xl">カート</h1>
      </div>
      {loading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Loading cart...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : (
        <CartClient items={items} />
      )}
    </div>
  );
}
