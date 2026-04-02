# Atelier Market

Next.js 14 / Prisma / NextAuth / Stripe / S3 SDK で構築した、BOOTH ライクなデジタルグッズ販売アプリです。購入者、出品者、管理者の 3 ロールに対応し、ローカル開発と GitHub への push を前提にそのまま使える構成にしています。

## スクリーンショット

### トップページ
![トップページ](docs/screenshots/01_home.png)

### 商品一覧
![商品一覧](docs/screenshots/02_products.png)

### 商品詳細
![商品詳細](docs/screenshots/05_product_detail.png)

### カート
![カート](docs/screenshots/06_cart.png)

### ログイン
![ログイン](docs/screenshots/03_login.png)

### 新規登録
![新規登録](docs/screenshots/04_register.png)

### 購入完了
![購入完了](docs/screenshots/10_checkout_success.png)

---

## 画面遷移

```
未ログイン時の主な動線
──────────────────────────────────────────────────────

/ (トップ)
├─[作品を探す]──→ /products (商品一覧)
│                    └─[商品カードをクリック]──→ /products/[id] (商品詳細)
│                                                  ├─[Buy / Add to cart]──→ /cart (要ログイン)
│                                                  └─[ログイン済みで購入済み]──→ ダウンロード
└─[出品を始める]─→ /seller/dashboard (要 SELLER ロール)

ナビバー
├─ Products ──→ /products
├─ Sell ──────→ /seller/dashboard (未認証なら /auth/login へリダイレクト)
├─ Admin ─────→ /admin (ADMIN ロール以外は / へリダイレクト)
├─ Cart ──────→ /cart
├─ Log in ────→ /auth/login
└─ Register ──→ /auth/register


認証フロー
──────────────────────────────────────────────────────

/auth/register (新規登録)
  └─[登録成功]──→ /auth/login

/auth/login (ログイン)
  └─[ログイン成功]──→ / (トップ)


購入フロー（ログイン済み BUYER）
──────────────────────────────────────────────────────

/products/[id] (商品詳細)
  └─[Buy / Add to cart]
      ├─ カートに追加 ──→ /cart (カートページ)
      │                     └─[Checkout]──→ Stripe Checkout (外部)
      │                                       └─[決済成功]──→ /checkout/success
      │                                                           ├─[マイページへ]──→ /mypage
      │                                                           └─[商品一覧へ戻る]──→ /products
      └─ すでに購入済みの場合: ダウンロードボタンを表示
                                 └─ /api/downloads/[orderId] (署名付き S3 URL を返す)


マイページ（ログイン済み）
──────────────────────────────────────────────────────

/mypage
├─ 注文履歴タブ: 注文一覧 + ステータスバッジ
└─ ダウンロードタブ: 購入商品 → ダウンロードボタン
                       └─ /api/downloads/[orderId] ──→ 署名付き URL (15 分)


出品者フロー（SELLER ロール）
──────────────────────────────────────────────────────

/seller/dashboard (ダッシュボード)
├─[New Product]──→ /seller/products/new
│                     └─[保存]──→ /seller/dashboard
└─[Edit]─────────→ /seller/products/[id]/edit
                      └─[更新]──→ /seller/dashboard

商品作成・編集で可能な操作:
  ・タイトル / 説明 / 価格 / カテゴリ設定
  ・商品画像アップロード (S3)
  ・販売ファイルアップロード (S3 プライベートバケット)
  ・ステータス切替 (DRAFT / PUBLISHED / SUSPENDED)


管理者フロー（ADMIN ロール）
──────────────────────────────────────────────────────

/admin (管理ダッシュボード)
├─ ユーザー一覧 + ロール変更 (BUYER / SELLER / ADMIN)
├─ 注文一覧 (全ユーザー分)
└─ 商品一覧 (DRAFT / SUSPENDED 含む全件)


ミドルウェアによるアクセス制御
──────────────────────────────────────────────────────

パス                   必要な条件
/mypage                ログイン済み (どのロールでも可)
/seller/*              ログイン済み + SELLER または ADMIN ロール
/admin/*               ログイン済み + ADMIN ロール
上記以外               誰でもアクセス可
```

---

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

| 変数 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 (例: `postgresql://user:pass@localhost:5432/booth`) |
| `NEXTAUTH_URL` | アプリの URL (例: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ランダムな長い文字列 (`openssl rand -base64 32` で生成) |
| `STRIPE_SECRET_KEY` | Stripe シークレットキー (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名シークレット (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー (`pk_test_...`) |
| `S3_BUCKET` | S3 / R2 バケット名 |
| `S3_ACCESS_KEY_ID` | アクセスキー |
| `S3_SECRET_ACCESS_KEY` | シークレットキー |
| `S3_ENDPOINT` | R2 利用時に設定 (例: `https://xxx.r2.cloudflarestorage.com`) |
| `S3_PUBLIC_BASE_URL` | 商品画像の公開ベース URL |

## データベース初期化

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

シードで以下を投入します。

| アカウント | メール | パスワード | ロール |
|---|---|---|---|
| 管理者 | `admin@example.com` | `password123` | ADMIN |
| 出品者 | `seller@example.com` | `password123` | SELLER |

- カテゴリ: Illustration / 3D Assets / Music
- サンプル商品: 5 件 (Neon City Illustration Pack ほか)

## 開発サーバー

```bash
npm run dev
```

## Stripe Webhook (ローカル)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## API 一覧

| メソッド | パス | 説明 | 権限 |
|---|---|---|---|
| GET/POST | `/api/products` | 商品一覧取得・作成 | GET: 公開 / POST: SELLER |
| GET/PUT/DELETE | `/api/products/[id]` | 商品取得・更新・削除 | GET: 公開 / 変更: オーナー or ADMIN |
| POST | `/api/products/[id]/images` | 商品画像アップロード | SELLER |
| POST | `/api/products/[id]/files` | 販売ファイルアップロード | SELLER |
| GET/POST/DELETE | `/api/cart` | カート操作 | ログイン済み |
| POST | `/api/checkout` | Stripe Checkout セッション作成 | ログイン済み |
| POST | `/api/webhooks/stripe` | Stripe Webhook 受信 | Stripe |
| GET | `/api/orders` | 注文一覧 | ログイン済み |
| GET | `/api/downloads/[orderId]` | 署名付きダウンロード URL | 購入者 or ADMIN |
| GET/PATCH | `/api/admin/users` | ユーザー管理 | ADMIN |
| GET | `/api/admin/orders` | 全注文管理 | ADMIN |
| GET | `/api/admin/products` | 全商品管理 | ADMIN |
| POST | `/api/auth/register` | 新規登録 | 公開 |

## 備考

- S3 の生 URL は返さず、ダウンロードは署名付き URL (15 分) のみ返します。
- OAuth は環境変数がある場合のみ有効化されます。
- Stripe と S3 が未設定でも UI と基本 CRUD はローカル確認できます。
