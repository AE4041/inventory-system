import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { assertStoreAccess } from "../middleware/auth.js";
import { applyInventoryChange } from "../services/inventory.service.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

export const listStockTransfers = asyncHandler(async (req, res) => {
  const { storeId, status } = req.query;
  const { page, pageSize, skip, take } = parsePagination(req.query);

  const where = { organizationId: req.user.organizationId };
  if (storeId) {
    assertStoreAccess(req.user, storeId);
    where.OR = [{ sourceStoreId: storeId }, { destinationStoreId: storeId }];
  } else if (req.user.role !== "ADMIN") {
    where.OR = [{ sourceStoreId: { in: req.user.storeIds } }, { destinationStoreId: { in: req.user.storeIds } }];
  }
  if (status) where.status = status;

  const [total, rows] = await Promise.all([
    prisma.stockTransfer.count({ where }),
    prisma.stockTransfer.findMany({
      where,
      include: { product: true, sourceStore: true, destinationStore: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.json({ success: true, ...paginatedResponse(rows, total, page, pageSize) });
});

export const createStockTransfer = asyncHandler(async (req, res) => {
  const { productId, sourceStoreId, destinationStoreId, quantity } = req.body;

  if (sourceStoreId === destinationStoreId) {
    throw ApiError.badRequest("Source and destination store must be different");
  }
  assertStoreAccess(req.user, sourceStoreId);
  assertStoreAccess(req.user, destinationStoreId);

  const transfer = await prisma.$transaction(async (tx) => {
    const created = await tx.stockTransfer.create({
      data: {
        organizationId: req.user.organizationId,
        productId,
        sourceStoreId,
        destinationStoreId,
        quantity,
        createdById: req.user.id,
        status: "PENDING",
      },
    });

    await applyInventoryChange(tx, {
      storeId: sourceStoreId,
      productId,
      userId: req.user.id,
      type: "TRANSFER_OUT",
      quantity,
      reason: `Transfer ${created.id} to store ${destinationStoreId}`,
      referenceId: created.id,
    });

    return created;
  });

  res.status(201).json({ success: true, data: transfer });
});

export const completeStockTransfer = asyncHandler(async (req, res) => {
  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!transfer) throw ApiError.notFound("Stock transfer not found");
  if (transfer.status !== "PENDING") throw ApiError.badRequest("Only pending transfers can be completed");
  assertStoreAccess(req.user, transfer.destinationStoreId);

  const updated = await prisma.$transaction(async (tx) => {
    await applyInventoryChange(tx, {
      storeId: transfer.destinationStoreId,
      productId: transfer.productId,
      userId: req.user.id,
      type: "TRANSFER_IN",
      quantity: transfer.quantity,
      reason: `Transfer ${transfer.id} from store ${transfer.sourceStoreId}`,
      referenceId: transfer.id,
    });

    return tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });

  res.json({ success: true, data: updated });
});

export const cancelStockTransfer = asyncHandler(async (req, res) => {
  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!transfer) throw ApiError.notFound("Stock transfer not found");
  if (transfer.status !== "PENDING") throw ApiError.badRequest("Only pending transfers can be cancelled");
  assertStoreAccess(req.user, transfer.sourceStoreId);

  const updated = await prisma.$transaction(async (tx) => {
    await applyInventoryChange(tx, {
      storeId: transfer.sourceStoreId,
      productId: transfer.productId,
      userId: req.user.id,
      type: "ADDITION",
      quantity: transfer.quantity,
      reason: `Transfer ${transfer.id} cancelled - stock restored`,
      referenceId: transfer.id,
    });

    return tx.stockTransfer.update({ where: { id: transfer.id }, data: { status: "CANCELLED" } });
  });

  res.json({ success: true, data: updated });
});
