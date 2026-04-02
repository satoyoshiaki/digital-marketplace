import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function MyPage() {
  const user = await requireUser();
  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <CardTitle>マイページ</CardTitle>
            <p className="text-sm text-muted-foreground">
              {user.name ?? "Guest"} / {user.email}
            </p>
          </div>
          <LogoutButton />
        </CardHeader>
      </Card>

      <div className="space-y-5">
        <h2 className="text-3xl font-semibold">注文履歴</h2>
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{order.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-3xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              item.product.images[0]?.url ??
                              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={item.product.title}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div>
                            <p className="font-medium">{item.titleSnapshot}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/api/downloads/${order.id}?productId=${item.productId}`}
                          className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                        >
                          Download
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-sm text-muted-foreground">
              購入済みの作品はまだありません。
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
