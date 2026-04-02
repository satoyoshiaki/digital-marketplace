import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleSchema } from "@/lib/validations";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: {
      sellerProfile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string; role?: UserRole };
  const parsed = roleSchema.safeParse({ role: body.role });

  if (!body.userId || !parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    include: { sellerProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: body.userId },
    data: { role: parsed.data.role },
  });

  if (parsed.data.role === UserRole.SELLER && !user.sellerProfile) {
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        displayName: user.name ?? user.email.split("@")[0],
      },
    });
  }

  return NextResponse.json({ user: updated });
}
