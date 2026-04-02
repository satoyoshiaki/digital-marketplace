import Link from "next/link";

import { getAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await getAuthSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-3xl font-semibold">
            Atelier Market
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/products">Products</Link>
            <Link href="/seller/dashboard">Sell</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="text-sm font-medium text-muted-foreground">
            Cart
          </Link>
          {session?.user ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/mypage">My Page</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
