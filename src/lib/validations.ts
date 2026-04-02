import { ProductStatus, UserRole } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(2).max(80).optional(),
  wantsSeller: z.boolean().optional().default(false),
  displayName: z.string().trim().min(2).max(80).optional(),
});

export const sellerProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  payoutEmail: z.string().trim().email().optional().or(z.literal("")),
});

export const productCreateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(5000),
  price: z.coerce.number().int().min(100).max(1_000_000),
  categoryId: z.string().cuid(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  isFeatured: z.coerce.boolean().optional().default(false),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productQuerySchema = z.object({
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  featured: z
    .string()
    .transform((value) => value === "true")
    .optional(),
  sellerProfileId: z.string().cuid().optional(),
});

export const cartMutationSchema = z.object({
  action: z.enum(["add", "set", "remove", "clear"]).default("add"),
  productId: z.string().cuid().optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export const checkoutSchema = z.object({
  cartId: z.string().cuid().optional(),
});

export const uploadImageSchema = z.object({
  order: z.coerce.number().int().min(0).max(20).default(0),
  altText: z.string().trim().max(120).optional(),
});

export const uploadFileSchema = z.object({
  filename: z.string().trim().min(1).max(255).optional(),
});

export const roleSchema = z.object({
  role: z.nativeEnum(UserRole),
});
