"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addToCart() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "add",
        productId,
        quantity: 1,
      }),
    });

    const body = (await response.json()) as { error?: string };

    setLoading(false);
    setMessage(response.ok ? "Added to cart" : body.error ?? "Failed to add");
  }

  return (
    <div className="space-y-2">
      <Button onClick={addToCart} disabled={loading} className="w-full">
        {loading ? "Adding..." : "Buy / Add to cart"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
