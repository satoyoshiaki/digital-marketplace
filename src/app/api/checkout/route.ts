import { NextResponse } from "next/server";
import { z } from "zod";

import { ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";

const checkoutRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.coerce.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const items = parsed.data.items;
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: ProductStatus.PUBLISHED,
    },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Some products were not found" }, { status: 400 });
  }

  const productsById = new Map(products.map((product) => [product.id, product]));

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: undefined,
    success_url: `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl()}/cart`,
    metadata: {
      productIds: JSON.stringify(items.map((item) => item.productId)),
      quantities: JSON.stringify(
        Object.fromEntries(items.map((item) => [item.productId, item.quantity])),
      ),
    },
    line_items: items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new Error(`Missing product for checkout item: ${item.productId}`);
      }

      return {
        quantity: item.quantity,
        price_data: {
          currency: "jpy",
          unit_amount: product.price,
          product_data: {
            name: product.title,
            description: product.description.slice(0, 200),
          },
        },
      };
    }),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
