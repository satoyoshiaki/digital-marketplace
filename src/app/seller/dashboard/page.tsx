import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSeller } from "@/lib/auth";
import { getSellerDashboardData } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export default async function SellerDashboardPage() {
  const user = await requireSeller();

  if (!user.sellerProfileId) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-14">
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Seller profile is not configured for this account.
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboard = await getSellerDashboardData(user.sellerProfileId);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Seller Dashboard
          </p>
          <h1 className="text-5xl">出品ダッシュボード</h1>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">New Product</Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total revenue</p>
            <p className="mt-3 text-3xl font-semibold">
              {formatPrice(dashboard.stats.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Order count</p>
            <p className="mt-3 text-3xl font-semibold">{dashboard.stats.orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Product count</p>
            <p className="mt-3 text-3xl font-semibold">{dashboard.stats.products}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.status}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product._count.orderItems}</TableCell>
                  <TableCell>
                    <Link
                      href={`/seller/products/${product.id}/edit`}
                      className="text-sm font-semibold text-primary"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
