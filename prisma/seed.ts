import { ProductStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "password123";
  const passwordHash = await hash(adminPassword, 12);

  const categories = [
    {
      name: "Illustration",
      slug: "illustration",
      description: "キャラクター、背景、素材イラスト",
      imageUrl:
        "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "3D Assets",
      slug: "3d-assets",
      description: "ゲームや映像向けの 3D モデル",
      imageUrl:
        "https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Music",
      slug: "music",
      description: "BGM、効果音、ジングル",
      imageUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      name: "Marketplace Admin",
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      name: "Marketplace Admin",
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {
      passwordHash,
      role: UserRole.SELLER,
      name: "Studio North",
    },
    create: {
      email: "seller@example.com",
      passwordHash,
      role: UserRole.SELLER,
      name: "Studio North",
    },
  });

  const seller = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {
      displayName: "Studio North",
      bio: "イラスト、UI キット、BGM を販売するサンプルセラーです。",
      payoutEmail: "seller@example.com",
    },
    create: {
      userId: sellerUser.id,
      displayName: "Studio North",
      bio: "イラスト、UI キット、BGM を販売するサンプルセラーです。",
      payoutEmail: "seller@example.com",
    },
  });

  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany()).map((category) => [category.slug, category]),
  );

  const products = [
    {
      title: "Neon City Illustration Pack",
      description: "SF テイストの背景イラスト 12 枚セット。配信サムネイル、ゲーム背景、動画ビジュアルに使いやすい高解像度素材です。",
      price: 2400,
      categoryId: categoryMap.illustration.id,
      isFeatured: true,
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      file: "sample/neon-city-pack.zip",
    },
    {
      title: "Indie Game UI Kit",
      description: "ショップ、ステータス、モーダル、アイコンをまとめた Figma + PNG の UI キットです。ゲームジャム用途にも向いています。",
      price: 1800,
      categoryId: categoryMap.illustration.id,
      isFeatured: true,
      image:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
      file: "sample/ui-kit.zip",
    },
    {
      title: "Cozy Room 3D Asset Set",
      description: "Blender / FBX 対応の部屋オブジェクトセット。配信用背景やゲーム小物制作に向けた軽量なローポリ素材です。",
      price: 3200,
      categoryId: categoryMap["3d-assets"].id,
      isFeatured: false,
      image:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      file: "sample/cozy-room-assets.zip",
    },
    {
      title: "Lo-fi Creator BGM Vol.1",
      description: "配信、Vlog、ゲームのメニュー画面向け lo-fi BGM 8 曲セット。商用利用可のライセンス説明付きです。",
      price: 1500,
      categoryId: categoryMap.music.id,
      isFeatured: true,
      image:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
      file: "sample/lofi-bgm.zip",
    },
    {
      title: "Stream Overlay Starter Pack",
      description: "開始画面、待機画面、チャット枠、アラート枠を含む配信オーバーレイのスターターパックです。",
      price: 2200,
      categoryId: categoryMap.illustration.id,
      isFeatured: false,
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      file: "sample/stream-overlay.zip",
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: {
        sellerId: seller.id,
        title: product.title,
      },
    });

    const current =
      existing ??
      (await prisma.product.create({
        data: {
          sellerId: seller.id,
          categoryId: product.categoryId,
          title: product.title,
          description: product.description,
          price: product.price,
          status: ProductStatus.PUBLISHED,
          isFeatured: product.isFeatured,
        },
      }));

    await prisma.product.update({
      where: { id: current.id },
      data: {
        categoryId: product.categoryId,
        description: product.description,
        price: product.price,
        status: ProductStatus.PUBLISHED,
        isFeatured: product.isFeatured,
      },
    });

    await prisma.productImage.deleteMany({
      where: { productId: current.id },
    });

    await prisma.productFile.deleteMany({
      where: { productId: current.id },
    });

    await prisma.productImage.create({
      data: {
        productId: current.id,
        url: product.image,
        altText: product.title,
        order: 0,
      },
    });

    await prisma.productFile.create({
      data: {
        productId: current.id,
        filename: `${product.title}.zip`,
        s3Key: product.file,
        size: 1024 * 1024 * 8,
        mimeType: "application/zip",
      },
    });
  }

  console.log(`Seeded admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
