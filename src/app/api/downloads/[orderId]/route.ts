import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedDownloadUrl } from "@/lib/s3";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const wantsJson = searchParams.get("json") === "true";

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
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
      buyer: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (session.user.role !== UserRole.ADMIN && order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetItem =
    order.items.find((item) => item.productId === productId) ?? order.items[0];
  const file = targetItem?.product.files[0];

  if (!file) {
    return NextResponse.json({ error: "Download file not found" }, { status: 404 });
  }

  const url = await createSignedDownloadUrl(file.s3Key, 900);

  if (wantsJson) {
    return NextResponse.json({ url });
  }

  return NextResponse.redirect(url);
}
