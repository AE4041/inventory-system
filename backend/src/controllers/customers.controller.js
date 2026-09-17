import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { assertStoreAccess } from "../middleware/auth.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

export const listCustomers = asyncHandler(async (req, res) => {
  const { storeId, search } = req.query;
  const { page, pageSize, skip, take } = parsePagination(req.query);

  const where = { store: { organizationId: req.user.organizationId } };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.storeId = storeId;
  } else if (req.user.role !== "ADMIN") {
    where.storeId = { in: req.user.storeIds };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({ where, include: { store: true }, orderBy: { name: "asc" }, skip, take }),
  ]);

  res.json({ success: true, ...paginatedResponse(customers, total, page, pageSize) });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
    include: { store: true },
  });
  if (!customer) throw ApiError.notFound("Customer not found");

  const sales = await prisma.sale.findMany({
    where: { customerId: customer.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, store: true, cashier: { select: { id: true, name: true } } },
  });

  const paidSales = sales.filter((s) => s.status === "PAID");
  const totalSpent = paidSales.reduce((sum, s) => sum + Number(s.total), 0);

  res.json({
    success: true,
    data: {
      ...customer,
      stats: {
        totalTransactions: paidSales.length,
        totalSpent,
        lastPurchase: sales[0]?.createdAt ?? null,
      },
      purchaseHistory: sales,
    },
  });
});

export const createCustomer = asyncHandler(async (req, res) => {
  assertStoreAccess(req.user, req.body.storeId);
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const existing = await prisma.customer.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Customer not found");
  assertStoreAccess(req.user, existing.storeId);

  const { storeId, ...rest } = req.body;
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data: rest });
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const existing = await prisma.customer.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Customer not found");
  assertStoreAccess(req.user, existing.storeId);

  await prisma.customer.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});
