import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertStoreAccess } from "../middleware/auth.js";
import { applyInventoryChange } from "../services/inventory.service.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import { effectivePrice } from "../utils/pricing.js";

export const listStock = asyncHandler(async (req, res) => {
  const { storeId, lowStockOnly } = req.query;
  const { page, pageSize, skip, take } = parsePagination(req.query);

  const where = { store: { organizationId: req.user.organizationId } };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.storeId = storeId;
  } else if (req.user.role !== "ADMIN") {
    where.storeId = { in: req.user.storeIds };
  }

  const [total, rows] = await Promise.all([
    prisma.storeProduct.count({ where }),
    prisma.storeProduct.findMany({
      where,
      include: { product: { include: { category: true } }, store: true },
      orderBy: { product: { name: "asc" } },
      skip,
      take,
    }),
  ]);

  let data = rows.map((r) => {
    const { costPrice, sellingPrice } = effectivePrice(r, r.product);
    return {
      id: r.id,
      storeId: r.storeId,
      storeName: r.store.name,
      product: { ...r.product, costPrice, sellingPrice },
      quantity: r.quantity,
      lowStock: r.quantity <= r.product.minStockLevel,
      stockValue: Number(costPrice) * r.quantity,
    };
  });

  if (lowStockOnly === "true") data = data.filter((r) => r.lowStock);

  res.json({ success: true, ...paginatedResponse(data, total, page, pageSize) });
});

export const listInventoryHistory = asyncHandler(async (req, res) => {
  const { storeId, productId } = req.query;
  const { page, pageSize, skip, take } = parsePagination(req.query);

  const where = { store: { organizationId: req.user.organizationId } };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.storeId = storeId;
  } else if (req.user.role !== "ADMIN") {
    where.storeId = { in: req.user.storeIds };
  }
  if (productId) where.productId = productId;

  const [total, rows] = await Promise.all([
    prisma.inventoryTransaction.count({ where }),
    prisma.inventoryTransaction.findMany({
      where,
      include: { product: true, store: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.json({ success: true, ...paginatedResponse(rows, total, page, pageSize) });
});

export const createAdjustment = asyncHandler(async (req, res) => {
  const { storeId, productId, type, quantity, reason } = req.body;
  assertStoreAccess(req.user, storeId);

  const transaction = await prisma.$transaction((tx) =>
    applyInventoryChange(tx, { storeId, productId, userId: req.user.id, type, quantity, reason })
  );

  res.status(201).json({ success: true, data: transaction });
});

export const getStockValuation = asyncHandler(async (req, res) => {
  const { storeId } = req.query;

  const where = { store: { organizationId: req.user.organizationId } };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.storeId = storeId;
  } else if (req.user.role !== "ADMIN") {
    where.storeId = { in: req.user.storeIds };
  }

  const rows = await prisma.storeProduct.findMany({ where, include: { product: true } });

  const totals = rows.reduce(
    (acc, r) => {
      const { costPrice, sellingPrice } = effectivePrice(r, r.product);
      acc.totalUnits += r.quantity;
      acc.costValue += Number(costPrice) * r.quantity;
      acc.retailValue += Number(sellingPrice) * r.quantity;
      return acc;
    },
    { totalUnits: 0, costValue: 0, retailValue: 0 }
  );

  res.json({ success: true, data: totals });
});
