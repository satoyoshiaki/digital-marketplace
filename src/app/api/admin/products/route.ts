import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    include: {
      seller: {
        include: {
          user: true,
        },
      },
      category: true,
      images: true,
      files: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ products });
}
