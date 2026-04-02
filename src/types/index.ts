import type {
  Category,
  Download,
  Order,
  OrderItem,
  Product,
  ProductFile,
  ProductImage,
  ProductStatus,
  SellerProfile,
  User,
  UserRole,
} from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  sellerProfileId: string | null;
};

export type ProductWithRelations = Product & {
  category: Category;
  seller: SellerProfile & {
    user: Pick<User, "id" | "email" | "name">;
  };
  images: ProductImage[];
  files: ProductFile[];
  _count?: {
    orderItems: number;
  };
};

export type OrderWithRelations = Order & {
  items: Array<
    OrderItem & {
      product: Product & {
        images: ProductImage[];
      };
    }
  >;
  downloads: Download[];
};

export type ProductFilters = {
  search?: string;
  category?: string;
  featured?: boolean;
};

export type DashboardStats = {
  revenue: number;
  orders: number;
  products: number;
  downloads: number;
};

export type ProductFormValues = {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  status: ProductStatus;
  isFeatured: boolean;
};
