import { ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getCategories, getProducts } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { productCreateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const featured = searchParams.get("featured") === "true";
  const sellerProfileId = searchParams.get("sellerProfileId")?.trim();

  const [products, categories] = await Promise.all([
    getProducts({
      search: q || undefined,
      category: category || undefined,
      featured: featured || undefined,
    }),
    getCategories(),
  ]);

  const filteredProducts = sellerProfileId
    ? products.filter((product) => product.sellerId === sellerProfileId)
    : products;

  return NextResponse.json({ products: filteredProducts, categories });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.sellerProfileId) {
    return NextResponse.json({ error: "Seller profile required" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = productCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().formErrors[0] ?? "Invalid product payload" },
      { status: 400 },
    );
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      status: parsed.data.status ?? ProductStatus.DRAFT,
      sellerId: session.user.sellerProfileId,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
