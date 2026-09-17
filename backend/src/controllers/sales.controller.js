import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { assertStoreAccess } from "../middleware/auth.js";
import { createSale, refundSale, cancelSale, markSalePaid, updateSaleItems } from "../services/sales.service.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

function buildSalesWhere(req) {
  const { storeId, customerId, userId, productId, paymentMethod, status, from, to } = req.query;

  const where = { store: { organizationId: req.user.organizationId } };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.storeId = storeId;
  } else if (req.user.role !== "ADMIN") {
    where.storeId = { in: req.user.storeIds };
  }
  if (customerId) where.customerId = customerId;
  if (userId) where.userId = userId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (status) where.status = status;
  if (productId) where.items = { some: { productId } };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  return where;
}

export const listSales = asyncHandler(async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const where = buildSalesWhere(req);

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: {
        store: true,
        customer: true,
        cashier: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.json({ success: true, ...paginatedResponse(sales, total, page, pageSize) });
});

export const getSale = asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
    include: {
      store: true,
      customer: true,
      cashier: { select: { id: true, name: true } },
      items: { include: { product: true } },
      payments: true,
    },
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  res.json({ success: true, data: sale });
});

export const createSaleHandler = asyncHandler(async (req, res) => {
  const { storeId } = req.body;
  assertStoreAccess(req.user, storeId);

  const sale = await createSale({
    organizationId: req.user.organizationId,
    storeId,
    userId: req.user.id,
    customerId: req.body.customerId,
    items: req.body.items,
    discount: req.body.discount,
    paymentMethod: req.body.paymentMethod,
  });

  res.status(201).json({ success: true, data: sale });
});

export const refundSaleHandler = asyncHandler(async (req, res) => {
  const existing = await prisma.sale.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Sale not found");
  assertStoreAccess(req.user, existing.storeId);

  const sale = await refundSale({
    organizationId: req.user.organizationId,
    saleId: req.params.id,
    userId: req.user.id,
    reason: req.body?.reason,
  });
  res.json({ success: true, data: sale });
});

export const cancelSaleHandler = asyncHandler(async (req, res) => {
  const existing = await prisma.sale.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Sale not found");
  assertStoreAccess(req.user, existing.storeId);

  const sale = await cancelSale({
    organizationId: req.user.organizationId,
    saleId: req.params.id,
    userId: req.user.id,
    reason: req.body?.reason,
  });
  res.json({ success: true, data: sale });
});

export const markSalePaidHandler = asyncHandler(async (req, res) => {
  const existing = await prisma.sale.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Sale not found");
  assertStoreAccess(req.user, existing.storeId);

  const sale = await markSalePaid({ organizationId: req.user.organizationId, saleId: req.params.id });
  res.json({ success: true, data: sale });
});

export const updateSaleItemsHandler = asyncHandler(async (req, res) => {
  const existing = await prisma.sale.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Sale not found");
  assertStoreAccess(req.user, existing.storeId);

  const sale = await updateSaleItems({
    organizationId: req.user.organizationId,
    saleId: req.params.id,
    userId: req.user.id,
    items: req.body.items,
  });
  res.json({ success: true, data: sale });
});
