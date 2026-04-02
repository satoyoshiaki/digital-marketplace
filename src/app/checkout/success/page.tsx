import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stripe } from "@/lib/stripe";

type CheckoutSuccessPageProps = {
  searchParams?: {
    session_id?: string;
  };
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const sessionId = searchParams?.session_id;
  let orderReference = sessionId ?? "N/A";

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      orderReference = session.payment_intent?.toString() ?? session.id;
    } catch {
      orderReference = sessionId;
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>購入が完了しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base leading-7 text-muted-foreground">
            決済が確認されました。マイページから注文履歴とダウンロードに進めます。
          </p>
          <div className="rounded-3xl border border-border bg-secondary/30 p-5">
            <p className="text-sm text-muted-foreground">Order reference</p>
            <p className="mt-2 text-lg font-semibold">{orderReference}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/mypage" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              マイページへ
            </Link>
            <Link href="/products" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
              商品一覧へ戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
