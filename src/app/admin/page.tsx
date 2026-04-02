import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

async function updateUserRole(formData: FormData) {
  "use server";

  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!userId || !Object.values(UserRole).includes(role)) {
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true },
  });

  if (!existing) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  if (role === UserRole.SELLER && !existing.sellerProfile) {
    await prisma.sellerProfile.create({
      data: {
        userId,
        displayName: existing.name ?? existing.email.split("@")[0],
      },
    });
  }

  revalidatePath("/admin");
}

export default async function AdminPage() {
  await requireAdmin();

  const [userCount, orderCount, productCount, revenueAggregate, users, orders, products] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.order.findMany({
        include: {
          buyer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.product.findMany({
        include: {
          seller: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  const revenue = revenueAggregate._sum.totalAmount ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-14">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Admin
        </p>
        <h1 className="text-5xl">管理ダッシュボード</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="mt-3 text-3xl font-semibold">{userCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="mt-3 text-3xl font-semibold">{orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Products</p>
            <p className="mt-3 text-3xl font-semibold">{productCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="mt-3 text-3xl font-semibold">{formatPrice(revenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <form action={updateUserRole} className="flex flex-wrap gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      {Object.values(UserRole).map((role) => (
                        <button
                          key={role}
                          type="submit"
                          name="role"
                          value={role}
                          className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
                        >
                          {role}
                        </button>
                      ))}
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.buyer?.email ?? order.customerEmail ?? "Guest checkout"}</TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.title}</TableCell>
                  <TableCell>{product.seller.displayName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.status}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
