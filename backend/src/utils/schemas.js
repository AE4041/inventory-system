import { z } from "zod";

// Central place for reusable request-validation schemas.

export const registerOrgSchema = z.object({
  organizationName: z.string().min(2),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  storeIds: z.array(z.string()).default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(),
  active: z.boolean().optional(),
  storeIds: z.array(z.string()).optional(),
});

export const storeSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  active: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  unit: z.string().min(1).default("pcs"),
  minStockLevel: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

// `null` means "clear the override and use the product's default price" — distinct from 0,
// which is a legitimate (free) price. z.coerce.number() would otherwise turn null into 0.
const priceOverrideValue = z.union([z.literal(null), z.coerce.number().min(0)]);

export const storePriceSchema = z.object({
  storeId: z.string(),
  costPrice: priceOverrideValue,
  sellingPrice: priceOverrideValue,
});

export const inventoryAdjustmentSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  type: z.enum(["ADDITION", "DEDUCTION", "ADJUSTMENT"]),
  quantity: z.coerce.number().int(),
  reason: z.string().optional().nullable(),
});

export const stockTransferSchema = z.object({
  productId: z.string(),
  sourceStoreId: z.string(),
  destinationStoreId: z.string(),
  quantity: z.coerce.number().int().positive(),
});

export const customerSchema = z.object({
  storeId: z.string(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

export const createSaleSchema = z.object({
  storeId: z.string(),
  customerId: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER", "OTHER"]),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1),
});

export const expenseSchema = z.object({
  storeId: z.string(),
  categoryId: z.string(),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER", "OTHER"]),
  date: z.coerce.date(),
  attachmentUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
