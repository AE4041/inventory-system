import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { generateIntegrationToken } from "../utils/token.js";

export const listStores = asyncHandler(async (req, res) => {
  const where = { organizationId: req.user.organizationId };
  if (req.user.role !== "ADMIN") {
    where.id = { in: req.user.storeIds };
  }
  // mikrotikToken is a credential, not a display field — never return it from a listing
  // any authenticated user (cashiers included) can call.
  const stores = await prisma.store.findMany({ where, orderBy: { name: "asc" }, omit: { mikrotikToken: true } });
  res.json({ success: true, data: stores });
});

export const getStore = asyncHandler(async (req, res) => {
  const store = await prisma.store.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    omit: { mikrotikToken: true },
  });
  if (!store) throw ApiError.notFound("Store not found");
  res.json({ success: true, data: store });
});

// Admin-only: whether an integration token has been generated for this store yet, without
// ever returning the token value itself once it's been shown at generation time.
export const getMikrotikStatus = asyncHandler(async (req, res) => {
  const store = await prisma.store.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    select: { id: true, mikrotikToken: true },
  });
  if (!store) throw ApiError.notFound("Store not found");
  res.json({ success: true, data: { hasToken: !!store.mikrotikToken } });
});

export const createStore = asyncHandler(async (req, res) => {
  const store = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: { ...req.body, organizationId: req.user.organizationId },
    });

    // Every existing product needs a zero-stock inventory row in the new store.
    const products = await tx.product.findMany({
      where: { organizationId: req.user.organizationId },
      select: { id: true },
    });
    if (products.length) {
      await tx.storeProduct.createMany({
        data: products.map((p) => ({ storeId: store.id, productId: p.id, quantity: 0 })),
      });
    }
    return store;
  });

  res.status(201).json({ success: true, data: store });
});

export const updateStore = asyncHandler(async (req, res) => {
  const existing = await prisma.store.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Store not found");

  const store = await prisma.store.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: store });
});

// Issues a fresh MikroTik integration token for this store, invalidating any previous one.
// Shown once in the response — the frontend must display it immediately, it isn't stored
// anywhere retrievable in plain text after this (well, it is, in the DB column, but the UI
// never fetches/displays it again after the initial generation to keep habits safe).
export const regenerateMikrotikToken = asyncHandler(async (req, res) => {
  const existing = await prisma.store.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Store not found");

  const mikrotikToken = generateIntegrationToken();
  await prisma.store.update({ where: { id: req.params.id }, data: { mikrotikToken } });
  res.json({ success: true, data: { mikrotikToken } });
});
