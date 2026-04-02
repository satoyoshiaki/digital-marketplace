import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().formErrors[0] ?? "Invalid registration payload" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name || null,
      passwordHash,
      role: parsed.data.wantsSeller ? UserRole.SELLER : UserRole.BUYER,
      sellerProfile: parsed.data.wantsSeller
        ? {
            create: {
              displayName:
                parsed.data.displayName ||
                parsed.data.name ||
                parsed.data.email.split("@")[0],
            },
          }
        : undefined,
    },
    include: {
      sellerProfile: true,
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
