"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const CART_STORAGE_KEY = "atelier_cart";

type StoredCartItem = {
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type CartProductResponse = {
  items: Array<{
    id: string;
    title: string;
    price: number;
    imageUrl: string | null;
  }>;
};

function readCart() {
  if (typeof window === "undefined") {
    return [] as StoredCartItem[];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: StoredCartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartClient() {
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCart() {
      const storedItems = readCart();

      if (storedItems.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/cart?ids=${storedItems.map((item) => item.productId).join(",")}`,
          { cache: "no-store" },
        );
        const body = (await response.json()) as CartProductResponse;

        if (!response.ok) {
          throw new Error("Failed to load cart items");
        }

        const productMap = new Map(body.items.map((item) => [item.id, item]));
        const hydratedItems = storedItems
          .map((item) => {
            const product = productMap.get(item.productId);

            if (!product) {
              return null;
            }

            return {
              ...item,
              title: product.title,
              price: product.price,
              imageUrl: product.imageUrl,
            };
          })
          .filter((item): item is StoredCartItem => Boolean(item));

        writeCart(hydratedItems);
        setItems(hydratedItems);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load cart");
        setItems(storedItems);
      } finally {
        setLoading(false);
      }
    }

    void loadCart();
  }, []);

  function updateCart(nextItems: StoredCartItem[]) {
    setItems(nextItems);
    writeCart(nextItems);
  }

  function updateQuantity(productId: string, quantity: number) {
    const nextQuantity = Math.max(1, Math.min(quantity, 10));
    updateCart(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  }

  function removeItem(productId: string) {
    updateCart(items.filter((item) => item.productId !== productId));
  }

  async function checkout() {
    if (items.length === 0) {
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const body = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !body.url) {
        throw new Error(body.error ?? "Checkout failed");
      }

      window.location.href = body.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed");
      setCheckoutLoading(false);
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading cart...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 rounded-[28px] border bg-white p-8 text-center shadow-card">
        <p className="text-sm text-muted-foreground">カートに商品がありません。</p>
        <Link href="/products" className="text-sm font-medium text-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex flex-col gap-4 rounded-[28px] border bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-secondary/40">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={1}
                max={10}
                value={item.quantity}
                className="h-11 w-20 rounded-2xl border border-input px-3"
                onChange={(event) => updateQuantity(item.productId, Number(event.target.value) || 1)}
              />
              <Button variant="outline" onClick={() => removeItem(item.productId)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] border bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{formatPrice(totalPrice)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="w-full sm:w-auto" onClick={checkout} disabled={checkoutLoading}>
            {checkoutLoading ? "Redirecting..." : "Checkout"}
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
