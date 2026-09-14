import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { assertStoreAccess } from "../middleware/auth.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import { effectivePrice } from "../utils/pricing.js";

function serialize(product, storeId) {
  const { storeProducts, ...rest } = product;
  const result = {
    ...rest,
    stockByStore: storeProducts?.map((sp) => ({
      storeId: sp.storeId,
      quantity: sp.quantity,
      costPrice: sp.costPrice,
      sellingPrice: sp.sellingPrice,
    })),
  };
  if (storeId) {
    const match = storeProducts?.find((sp) => sp.storeId === storeId);
    result.stock = match?.quantity ?? 0;
    result.lowStock = result.stock <= product.minStockLevel;
    result.defaultCostPrice = product.costPrice;
    result.defaultSellingPrice = product.sellingPrice;
    Object.assign(result, effectivePrice(match, product));
    result.hasPriceOverride = match?.costPrice != null || match?.sellingPrice != null;
  }
  return result;
}

export const listProducts = asyncHandler(async (req, res) => {
  const { search, categoryId, storeId, active, lowStockOnly } = req.query;
  const { page, pageSize, skip, take } = parsePagination(req.query);

  const where = { organizationId: req.user.organizationId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (active !== undefined) where.active = active === "true";

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, storeProducts: true },
      orderBy: { name: "asc" },
      skip,
      take,
    }),
  ]);

  let data = products.map((p) => serialize(p, storeId));
  if (storeId && lowStockOnly === "true") {
    data = data.filter((p) => p.lowStock);
  }

  res.json({ success: true, ...paginatedResponse(data, total, page, pageSize) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    include: { category: true, storeProducts: { include: { store: true } } },
  });
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, data: serialize(product, req.query.storeId) });
});

export const createProduct = asyncHandler(async (req, res) => {
  const stores = await prisma.store.findMany({ where: { organizationId: req.user.organizationId } });

  const product = await prisma.product.create({
    data: {
      ...req.body,
      organizationId: req.user.organizationId,
      storeProducts: { create: stores.map((store) => ({ storeId: store.id, quantity: 0 })) },
    },
    include: { category: true, storeProducts: true },
  });

  res.status(201).json({ success: true, data: serialize(product) });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Product not found");

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
    include: { category: true, storeProducts: true },
  });
  res.json({ success: true, data: serialize(product) });
});

// Sets (or clears, by passing null) a per-store price override for a product.
export const setProductStorePrice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { storeId, costPrice, sellingPrice } = req.body;
  assertStoreAccess(req.user, storeId);

  const product = await prisma.product.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!product) throw ApiError.notFound("Product not found");

  const store = await prisma.store.findFirst({ where: { id: storeId, organizationId: req.user.organizationId } });
  if (!store) throw ApiError.notFound("Store not found");

  const storeProduct = await prisma.storeProduct.upsert({
    where: { storeId_productId: { storeId, productId: id } },
    create: { storeId, productId: id, costPrice, sellingPrice },
    update: { costPrice, sellingPrice },
  });

  res.json({
    success: true,
    data: {
      storeId,
      costPrice: storeProduct.costPrice ?? product.costPrice,
      sellingPrice: storeProduct.sellingPrice ?? product.sellingPrice,
      hasPriceOverride: storeProduct.costPrice != null || storeProduct.sellingPrice != null,
    },
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Product not found");

  // Products with sales history are deactivated instead of deleted to preserve referential history.
  await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ success: true, data: { id: req.params.id } });
});
