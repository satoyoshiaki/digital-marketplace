import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/s3";
import { stripe } from "@/lib/stripe";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await stripe.checkout.sessions.retrieve(params.sessionId, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: params.sessionId },
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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const downloads = await Promise.all(
      order.items.flatMap((item) =>
        item.product.files.map(async (file) => ({
          productTitle: item.titleSnapshot,
          filename: file.filename,
          url: await getSignedDownloadUrl(file.s3Key, 900),
        })),
      ),
    );

    return NextResponse.json({ downloads });
  } catch {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
}
