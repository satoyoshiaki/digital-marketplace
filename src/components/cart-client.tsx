"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
  };
};

export function CartClient({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function updateItem(productId: string, action: "remove" | "set", quantity = 1) {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        productId,
        quantity,
      }),
    });

    router.refresh();
  }

  async function checkout() {
    setCheckoutLoading(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await response.json()) as { url?: string; error?: string };
    setCheckoutLoading(false);

    if (body.url) {
      window.location.href = body.url;
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-4 rounded-[28px] border bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={item.product.images[0]?.url ?? ""}
              alt={item.product.title}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div>
              <p className="font-semibold">{item.product.title}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              defaultValue={item.quantity}
              className="h-11 w-20 rounded-2xl border border-input px-3"
              onBlur={(event) =>
                updateItem(item.product.id, "set", Number(event.target.value) || 1)
              }
            />
            <Button variant="outline" onClick={() => updateItem(item.product.id, "remove")}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      {items.length > 0 ? (
        <Button className="w-full sm:w-auto" onClick={checkout} disabled={checkoutLoading}>
          {checkoutLoading ? "Redirecting..." : "Proceed to Stripe Checkout"}
        </Button>
      ) : null}
    </div>
  );
}
