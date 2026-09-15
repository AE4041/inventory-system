import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { applyInventoryChange } from "./inventory.service.js";
import { generateReceiptNumber } from "../utils/receiptNumber.js";

function round2(n) {
  return Math.round(n * 100) / 100;
}

export async function createSale({
  organizationId,
  storeId,
  userId,
  customerId,
  items,
  discount,
  paymentMethod,
  source = "POS",
  // The MikroTik voucher close-out already deducted stock in real time as each voucher was
  // redeemed (see mikrotikIntegration.controller.js) — deducting it again here when rolling
  // those redemptions into a daily Sale would double-count the loss.
  skipInventory = false,
  // Only used by the voucher close-out's missed-day recovery: backdates the Sale to when
  // the underlying redemptions actually happened, instead of whenever the recovery run
  // executes. Omit for a normal sale — Prisma's @default(now()) applies.
  createdAt,
}) {
  const productIds = items.map((i) => i.productId);
  // Independent lookups — run concurrently instead of waiting on one, then the other.
  const [products, organization] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, organizationId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
  ]);
  if (products.length !== new Set(productIds).size) {
    throw ApiError.badRequest("One or more products could not be found");
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let itemDiscounts = 0;
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    const lineSubtotal = item.unitPrice * item.quantity;
    subtotal += lineSubtotal;
    itemDiscounts += item.discount;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: round2(lineSubtotal - item.discount),
      productName: product.name,
    };
  });

  const totalDiscount = itemDiscounts + discount;
  const taxableAmount = Math.max(subtotal - totalDiscount, 0);
  const taxRate = Number(organization?.taxRate ?? 0);
  const tax = round2(taxableAmount * (taxRate / 100));
  const total = round2(taxableAmount + tax);

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        storeId,
        customerId: customerId || null,
        userId,
        receiptNumber: generateReceiptNumber(storeId),
        subtotal: round2(subtotal),
        discount: round2(totalDiscount),
        tax,
        total,
        paymentMethod,
        status: "COMPLETED",
        source,
        ...(createdAt && { createdAt }),
        items: {
          create: lineItems.map(({ productName, ...item }) => item),
        },
        payments: {
          create: [{ method: paymentMethod, amount: total }],
        },
      },
      include: { items: { include: { product: true } }, payments: true, customer: true, store: true, cashier: { select: { id: true, name: true } } },
    });

    if (!skipInventory) {
      for (const item of items) {
        await applyInventoryChange(tx, {
          storeId,
          productId: item.productId,
          userId,
          type: "SALE",
          quantity: item.quantity,
          reason: `Sale ${created.receiptNumber}`,
          referenceId: created.id,
        });
      }
    }

    return created;
  });

  return sale;
}

export async function refundSale({ organizationId, saleId, userId, reason }) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, store: { organizationId } },
    include: { items: true },
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  if (sale.status !== "COMPLETED") throw ApiError.badRequest("Only completed sales can be refunded");

  return prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await applyInventoryChange(tx, {
        storeId: sale.storeId,
        productId: item.productId,
        userId,
        type: "REFUND",
        quantity: item.quantity,
        reason: reason || `Refund for ${sale.receiptNumber}`,
        referenceId: sale.id,
      });
    }

    return tx.sale.update({
      where: { id: sale.id },
      data: { status: "REFUNDED" },
      include: { items: { include: { product: true } }, payments: true, customer: true, store: true, cashier: { select: { id: true, name: true } } },
    });
  });
}

export async function cancelSale({ organizationId, saleId, userId, reason }) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, store: { organizationId } },
    include: { items: true },
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  if (sale.status !== "COMPLETED") throw ApiError.badRequest("Only completed sales can be cancelled");

  return prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await applyInventoryChange(tx, {
        storeId: sale.storeId,
        productId: item.productId,
        userId,
        type: "REFUND",
        quantity: item.quantity,
        reason: reason || `Sale ${sale.receiptNumber} cancelled`,
        referenceId: sale.id,
      });
    }

    return tx.sale.update({
      where: { id: sale.id },
      data: { status: "CANCELLED" },
      include: { items: { include: { product: true } }, payments: true, customer: true, store: true, cashier: { select: { id: true, name: true } } },
    });
  });
}
