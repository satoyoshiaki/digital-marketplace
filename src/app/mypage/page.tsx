import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function MyPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (
    session.user.role !== UserRole.SELLER &&
    session.user.role !== UserRole.ADMIN
  ) {
    redirect("/auth/login");
  }

  const orders = await getOrdersForUser(session.user.id);
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <CardTitle>マイページ</CardTitle>
            <p className="text-sm text-muted-foreground">このページは出品者・管理者専用です</p>
            <p className="text-sm text-muted-foreground">
              {session.user.name ?? "User"} / {session.user.email}
            </p>
          </div>
          <LogoutButton />
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="text-sm text-muted-foreground">Completed Orders</p>
            <p className="text-3xl font-semibold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-3xl font-semibold">{formatPrice(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="text-3xl font-semibold">{session.user.role}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <h2 className="text-3xl font-semibold">注文サマリー</h2>
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
                        className="flex flex-col gap-2 rounded-3xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{item.titleSnapshot}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </p>
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
              参照できる注文はまだありません。
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
