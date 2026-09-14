import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const listExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.expenseCategory.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: categories });
});

export const createExpenseCategory = asyncHandler(async (req, res) => {
  const category = await prisma.expenseCategory.create({
    data: { ...req.body, organizationId: req.user.organizationId },
  });
  res.status(201).json({ success: true, data: category });
});

export const updateExpenseCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.expenseCategory.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Expense category not found");
  const category = await prisma.expenseCategory.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: category });
});

export const deleteExpenseCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.expenseCategory.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Expense category not found");
  await prisma.expenseCategory.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});
