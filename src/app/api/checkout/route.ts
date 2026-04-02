import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl()}/cart`,
    metadata: {
      userId: session.user.id,
      cartId: cart.id,
    },
    line_items: cart.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "jpy",
        unit_amount: item.product.price,
        product_data: {
          name: item.product.title,
          description: item.product.description.slice(0, 200),
        },
      },
    })),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
