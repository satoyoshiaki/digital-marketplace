import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildObjectKey, uploadBuffer } from "@/lib/s3";
import { uploadImageSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (
    session.user.role !== UserRole.ADMIN &&
    product.sellerId !== session.user.sellerProfileId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const parsed = uploadImageSchema.safeParse({
    order: formData.get("order"),
    altText: formData.get("altText"),
  });

  if (!(file instanceof File) || !parsed.success) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = buildObjectKey(`products/${params.id}/images`, file.name);
  const url = await uploadBuffer({
    key,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  const image = await prisma.productImage.create({
    data: {
      productId: params.id,
      url,
      order: parsed.data.order,
      altText: parsed.data.altText || null,
    },
  });

  return NextResponse.json({ url: image.url, id: image.id });
}
