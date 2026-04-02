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
      const productIds = JSON.parse(session.metadata?.productIds ?? "[]") as string[];
      const quantities = JSON.parse(
        session.metadata?.quantities ?? "{}",
      ) as Record<string, number>;
      const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;

      if (productIds.length > 0) {
        await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
          },
          include: {
            files: true,
          },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));
        const orderedItems = productIds
          .map((productId) => productsById.get(productId))
          .filter((product): product is NonNullable<typeof product> => Boolean(product));

        if (orderedItems.length > 0) {
          const totalAmount = orderedItems.reduce((sum, product) => {
            const quantity = quantities[product.id] ?? 1;
            return sum + product.price * quantity;
          }, 0);

          await prisma.$transaction(
            async (tx) => {
              const order = await tx.order.create({
                data: {
                  buyerId: null,
                  customerEmail,
                  stripeSessionId: session.id,
                  stripePaymentIntentId:
                    typeof session.payment_intent === "string"
                      ? session.payment_intent
                      : null,
                  status: OrderStatus.PAID,
                  totalAmount,
                  currency: session.currency ?? "jpy",
                  items: {
                    create: orderedItems.map((product) => ({
                      productId: product.id,
                      titleSnapshot: product.title,
                      price: product.price,
                      quantity: quantities[product.id] ?? 1,
                    })),
                  },
                },
              });

              await tx.download.createMany({
                data: orderedItems.map((product) => ({
                  userId: null,
                  productId: product.id,
                  orderId: order.id,
                })),
                skipDuplicates: true,
              });
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
