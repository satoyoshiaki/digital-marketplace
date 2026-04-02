import { OrderStatus, ProductStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ProductFilters } from "@/types";

const productInclude = {
  category: true,
  images: {
    orderBy: {
      order: "asc" as const,
    },
  },
  files: true,
  seller: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  },
  _count: {
    select: {
      orderItems: true,
    },
  },
} satisfies Prisma.ProductInclude;

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
    },
    include: productInclude,
    take: 8,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProducts(filters: ProductFilters = {}) {
  return prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
              { seller: { displayName: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(filters.featured ? { isFeatured: true } : {}),
    },
    include: productInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

export async function getCartByUserId(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: {
                  order: "asc",
                },
              },
              category: true,
            },
          },
        },
      },
    },
  });
}

export async function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: {
      buyerId: userId,
      status: OrderStatus.PAID,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
      downloads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getSellerDashboardData(sellerProfileId: string) {
  const [products, orderItems, downloads] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: sellerProfileId },
      include: {
        images: true,
        category: true,
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.orderItem.findMany({
      where: {
        product: {
          sellerId: sellerProfileId,
        },
        order: {
          status: OrderStatus.PAID,
        },
      },
      include: {
        order: true,
      },
    }),
    prisma.download.count({
      where: {
        product: {
          sellerId: sellerProfileId,
        },
      },
    }),
  ]);

  const revenue = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return {
    products,
    stats: {
      revenue,
      orders: orderItems.length,
      products: products.length,
      downloads,
    },
  };
}
