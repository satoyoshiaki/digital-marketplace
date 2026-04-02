import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cartMutationSchema } from "@/lib/validations";

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ items: cart?.items ?? [] });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cartMutationSchema.safeParse(await request.json());

  if (!parsed.success || !parsed.data.productId) {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }

  const cart = await getOrCreateCart(session.user.id);
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: parsed.data.productId,
      },
    },
  });

  switch (parsed.data.action) {
    case "remove":
      if (existing) {
        await prisma.cartItem.delete({ where: { id: existing.id } });
      }
      break;
    case "set":
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: parsed.data.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: parsed.data.productId,
            quantity: parsed.data.quantity,
          },
        });
      }
      break;
    case "clear":
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      break;
    default:
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + parsed.data.quantity, 10) },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: parsed.data.productId,
            quantity: parsed.data.quantity,
          },
        });
      }
      break;
  }

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ items: updatedCart?.items ?? [] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cartItemId } = (await request.json()) as { cartItemId?: string };

  if (!cartItemId) {
    return NextResponse.json({ error: "cartItemId is required" }, { status: 400 });
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== session.user.id) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return NextResponse.json({ success: true });
}
