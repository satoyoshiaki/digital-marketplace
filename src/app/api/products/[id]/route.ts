import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getProductById } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/validations";

async function canManageProduct(
  role: UserRole,
  sellerProfileId: string | null,
  productId: string,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { allowed: false, product: null };
  }

  if (role === UserRole.ADMIN || (sellerProfileId && product.sellerId === sellerProfileId)) {
    return { allowed: true, product };
  }

  return { allowed: false, product };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const product = await getProductById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, product } = await canManageProduct(
    session.user.role,
    session.user.sellerProfileId,
    params.id,
  );

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = productUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().formErrors[0] ?? "Invalid product payload" },
      { status: 400 },
    );
  }

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, product } = await canManageProduct(
    session.user.role,
    session.user.sellerProfileId,
    params.id,
  );

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.product.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
