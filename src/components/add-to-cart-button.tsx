"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const CART_STORAGE_KEY = "atelier_cart";

type CartItem = {
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type AddToCartButtonProps = {
  item: Omit<CartItem, "quantity">;
};

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function readCart() {
    if (typeof window === "undefined") {
      return [] as CartItem[];
    }

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  async function addToCart() {
    setLoading(true);
    setMessage(null);

    const existingCart = readCart();
    const existingItem = existingCart.find((cartItem) => cartItem.productId === item.productId);
    const nextCart = existingItem
      ? existingCart.map((cartItem) =>
          cartItem.productId === item.productId
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, 10) }
            : cartItem,
        )
      : [...existingCart, { ...item, quantity: 1 }];

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
    setLoading(false);
    setMessage("Added to cart");
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
