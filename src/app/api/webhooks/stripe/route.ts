import { OrderStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!existing) {
      const userId = session.metadata?.userId;
      const cartId = session.metadata?.cartId;

      if (userId && cartId) {
        const cart = await prisma.cart.findUnique({
          where: { id: cartId },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    files: true,
                  },
                },
              },
            },
          },
        });

        if (cart && cart.items.length > 0) {
          const totalAmount = cart.items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          );

          await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
              data: {
                buyerId: userId,
                stripeSessionId: session.id,
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : null,
                status: OrderStatus.PAID,
                totalAmount,
                currency: session.currency ?? "jpy",
                items: {
                  create: cart.items.map((item) => ({
                    productId: item.productId,
                    titleSnapshot: item.product.title,
                    price: item.product.price,
                    quantity: item.quantity,
                  })),
                },
              },
              include: {
                items: true,
              },
            });

            await tx.download.createMany({
              data: cart.items.map((item) => ({
                userId,
                productId: item.productId,
                orderId: order.id,
              })),
              skipDuplicates: true,
            });

            await tx.cartItem.deleteMany({
              where: {
                cartId: cart.id,
              },
            });
          }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
