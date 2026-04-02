import { CartClient } from "@/components/cart-client";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Cart
        </p>
        <h1 className="text-5xl">カート</h1>
      </div>
      <CartClient />
    </div>
  );
}
