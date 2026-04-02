# Atelier Market

Next.js 14 / Prisma / NextAuth / Stripe / S3 SDK で構築した、BOOTH ライクなデジタルグッズ販売アプリです。購入者、出品者、管理者の 3 ロールに対応し、ローカル開発と GitHub への push を前提にそのまま使える構成にしています。

## 技術スタック

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 互換の UI コンポーネント
- Prisma + PostgreSQL
- NextAuth.js
- Stripe Checkout / Webhooks
- AWS S3 / Cloudflare R2

## 主な機能

- トップ、商品一覧、商品詳細、カート、購入完了
- メールアドレス + パスワード認証
- GitHub / Google OAuth を環境変数で有効化可能
- セラー管理画面での商品作成、編集、画像アップロード、ファイルアップロード
- 管理画面でのユーザー、注文、商品一覧
- Stripe Webhook 経由の注文確定とダウンロード権限付与
- 署名付き URL による 15 分限定ダウンロード

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` の主要項目:

- `DATABASE_URL`: PostgreSQL 接続文字列
- `NEXTAUTH_URL`: 例 `http://localhost:3000`
- `NEXTAUTH_SECRET`: ランダムな十分長い文字列
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`: R2 利用時に設定

## データベース初期化

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

シードで以下を投入します。

- 管理者: `admin@example.com` / `password123`
- カテゴリ
- サンプル商品 5 件
- サンプルセラー

## 開発サーバー

```bash
npm run dev
```

## Stripe Webhook

ローカルでの受信例:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 主要ルート

- `/`
- `/products`
- `/products/[id]`
- `/cart`
- `/checkout/success`
- `/auth/login`
- `/auth/register`
- `/mypage`
- `/seller/dashboard`
- `/seller/products/new`
- `/seller/products/[id]/edit`
- `/admin`

## 備考

- S3 の生 URL は返さず、ダウンロードは署名付き URL のみ返します。
- OAuth は環境変数がある場合のみ有効化されます。
- Stripe と S3 が未設定でも UI と基本 CRUD はローカル確認できますが、決済と実アップロードは設定が必要です。
