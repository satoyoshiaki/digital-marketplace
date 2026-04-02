import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where:
      session.user.role === UserRole.ADMIN
        ? undefined
        : {
            buyerId: session.user.id,
          },
    include: {
      buyer: true,
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
      downloads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ orders });
}
