import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = Array.from(
    new Set(
      searchParams
        .get("ids")
        ?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) ?? [],
    ),
  );

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: ids },
    },
    select: {
      id: true,
      title: true,
      price: true,
      images: {
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  return NextResponse.json({
    items: products.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.images[0]?.url ?? null,
    })),
  });
}
