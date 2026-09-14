import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

function serialize(user) {
  const { passwordHash, storeAccess, ...rest } = user;
  return { ...rest, storeIds: storeAccess?.map((s) => s.storeId) ?? [] };
}

export const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { organizationId: req.user.organizationId },
    include: { storeAccess: { select: { storeId: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json({ success: true, data: users.map(serialize) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, storeIds } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      organizationId: req.user.organizationId,
      name,
      email,
      passwordHash,
      role,
      storeAccess: { create: storeIds.map((storeId) => ({ storeId })) },
    },
    include: { storeAccess: { select: { storeId: true } } },
  });

  res.status(201).json({ success: true, data: serialize(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, active, storeIds } = req.body;

  const existing = await prisma.user.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!existing) throw ApiError.notFound("User not found");

  const data = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;
  if (active !== undefined) data.active = active;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    if (storeIds !== undefined) {
      await tx.userStore.deleteMany({ where: { userId: id } });
      if (storeIds.length) {
        await tx.userStore.createMany({ data: storeIds.map((storeId) => ({ userId: id, storeId })) });
      }
    }
    return tx.user.update({
      where: { id },
      data,
      include: { storeAccess: { select: { storeId: true } } },
    });
  });

  res.json({ success: true, data: serialize(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) throw ApiError.badRequest("You cannot deactivate your own account");

  const existing = await prisma.user.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!existing) throw ApiError.notFound("User not found");

  // Soft delete: sale/expense/inventory history references this user, so we deactivate rather than remove.
  await prisma.user.update({ where: { id }, data: { active: false } });
  res.json({ success: true, data: { id } });
});
