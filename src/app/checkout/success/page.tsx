import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaseUrl } from "@/lib/utils";

type CheckoutSuccessPageProps = {
  searchParams?: {
    session_id?: string;
  };
};

type DownloadResponse = {
  downloads: Array<{
    productTitle: string;
    filename: string;
    url: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const sessionId = searchParams?.session_id;
  let downloads: DownloadResponse["downloads"] = [];

  if (sessionId) {
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/downloads/by-session/${sessionId}`,
        { cache: "no-store" },
      );

      if (response.ok) {
        const body = (await response.json()) as DownloadResponse;
        downloads = body.downloads;
      }
    } catch {
      downloads = [];
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>購入が完了しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionId ? (
            <>
              <p className="text-base leading-7 text-muted-foreground">
                決済が確認されました。以下のリンクから購入したデジタル商品をダウンロードできます。
              </p>
              {downloads.length > 0 ? (
                <div className="space-y-3">
                  {downloads.map((download) => (
                    <a
                      key={`${download.productTitle}-${download.filename}`}
                      href={download.url}
                      className="flex items-center justify-between rounded-3xl border border-border px-5 py-4 text-sm font-medium hover:bg-secondary/30"
                    >
                      <span>{download.productTitle}</span>
                      <span>{download.filename}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ダウンロードの準備中です。少し待ってからこのページを再読み込みしてください。
                </p>
              )}
            </>
          ) : (
            <p className="text-base leading-7 text-muted-foreground">
              決済が完了しました。メールまたは決済完了画面からダウンロード情報をご確認ください。
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              商品一覧へ戻る
            </Link>
            <Link href="/cart" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
              カートを見る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
