import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.create({
    data: { ...req.body, organizationId: req.user.organizationId },
  });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Category not found");
  const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Category not found");
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});
