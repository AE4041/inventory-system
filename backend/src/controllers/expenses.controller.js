import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { assertStoreAccess } from "../middleware/auth.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

function buildExpensesWhere(req) {
  const { storeId, categoryId, from, to } = req.query;

  const where = { store: { organizationId: req.user.organizationId } };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.storeId = storeId;
  } else if (req.user.role !== "ADMIN") {
    where.storeId = { in: req.user.storeIds };
  }
  if (categoryId) where.categoryId = categoryId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  return where;
}

export const listExpenses = asyncHandler(async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const where = buildExpensesWhere(req);

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: { store: true, category: true, recordedBy: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      skip,
      take,
    }),
  ]);

  res.json({ success: true, ...paginatedResponse(expenses, total, page, pageSize) });
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
    include: { store: true, category: true, recordedBy: { select: { id: true, name: true } } },
  });
  if (!expense) throw ApiError.notFound("Expense not found");
  res.json({ success: true, data: expense });
});

export const createExpense = asyncHandler(async (req, res) => {
  assertStoreAccess(req.user, req.body.storeId);
  const expense = await prisma.expense.create({
    data: { ...req.body, recordedById: req.user.id },
    include: { store: true, category: true, recordedBy: { select: { id: true, name: true } } },
  });
  res.status(201).json({ success: true, data: expense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Expense not found");
  assertStoreAccess(req.user, existing.storeId);

  const { storeId, ...rest } = req.body;
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: rest,
    include: { store: true, category: true, recordedBy: { select: { id: true, name: true } } },
  });
  res.json({ success: true, data: expense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, store: { organizationId: req.user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Expense not found");
  assertStoreAccess(req.user, existing.storeId);

  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});
