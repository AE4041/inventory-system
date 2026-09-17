import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { applyInventoryChange } from "./inventory.service.js";
import { generateReceiptNumber } from "../utils/receiptNumber.js";
import { effectivePrice } from "../utils/pricing.js";

const SALE_INCLUDE = { items: { include: { product: true } }, payments: true, customer: true, store: true, cashier: { select: { id: true, name: true } } };

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Shared by createSale and updateSaleItems so the subtotal/discount/tax/total formula
// can't drift between the two call sites.
function calculateTotals({ lineItems, discount, taxRate }) {
  const subtotal = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemDiscounts = lineItems.reduce((sum, i) => sum + i.discount, 0);
  const totalDiscount = itemDiscounts + discount;
  const taxableAmount = Math.max(subtotal - totalDiscount, 0);
  const tax = round2(taxableAmount * (taxRate / 100));
  const total = round2(taxableAmount + tax);
  return { subtotal: round2(subtotal), discount: round2(totalDiscount), tax, total };
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

  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: round2(item.unitPrice * item.quantity - item.discount),
      productName: product.name,
    };
  });

  const taxRate = Number(organization?.taxRate ?? 0);
  const totals = calculateTotals({ lineItems, discount, taxRate });

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        storeId,
        customerId: customerId || null,
        userId,
        receiptNumber: generateReceiptNumber(storeId),
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod,
        status: "DRAFT",
        source,
        ...(createdAt && { createdAt }),
        items: {
          create: lineItems.map(({ productName, ...item }) => item),
        },
        payments: {
          create: [{ method: paymentMethod, amount: totals.total }],
        },
      },
      include: SALE_INCLUDE,
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
  if (sale.status !== "PAID") throw ApiError.badRequest("Only paid sales can be refunded");

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
      include: SALE_INCLUDE,
    });
  });
}

// Also allowed on a DRAFT sale (not just PAID) — stock is already deducted the instant a
// sale/redemption is created regardless of status, so a mis-rung draft needs a way to
// release that stock without going through a full refund workflow.
export async function cancelSale({ organizationId, saleId, userId, reason }) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, store: { organizationId } },
    include: { items: true },
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  if (sale.status !== "PAID" && sale.status !== "DRAFT") throw ApiError.badRequest("Only paid or draft sales can be cancelled");

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
      include: SALE_INCLUDE,
    });
  });
}

// Pure bookkeeping flip — every sale (POS or MikroTik) is created as DRAFT so an admin
// can review it before it counts as finalized revenue. Stock already moved at creation
// time (or at voucher-redemption time for MikroTik), so there's nothing to reconcile here.
export async function markSalePaid({ organizationId, saleId }) {
  const sale = await prisma.sale.findFirst({ where: { id: saleId, store: { organizationId } } });
  if (!sale) throw ApiError.notFound("Sale not found");
  if (sale.status !== "DRAFT") throw ApiError.badRequest("Only draft sales can be marked as paid");

  return prisma.sale.update({ where: { id: sale.id }, data: { status: "PAID" }, include: SALE_INCLUDE });
}

// Admin correction on an already-paid invoice: `items` is the full desired line list
// ({productId, quantity}), diffed against what's currently on the sale. Quantity
// increases/new products deduct stock, decreases/removals refund it — same
// applyInventoryChange primitive every other stock-affecting action in this app uses.
export async function updateSaleItems({ organizationId, saleId, userId, items }) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, store: { organizationId } },
    include: { items: true, store: true },
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  if (sale.status !== "PAID") throw ApiError.badRequest("Only paid invoices can be edited");

  const productIds = items.map((i) => i.productId);
  const [products, organization, storeProducts] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, organizationId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.storeProduct.findMany({ where: { storeId: sale.storeId, productId: { in: productIds } } }),
  ]);
  if (products.length !== new Set(productIds).size) {
    throw ApiError.badRequest("One or more products could not be found");
  }
  const productMap = new Map(products.map((p) => [p.id, p]));
  const storeProductMap = new Map(storeProducts.map((sp) => [sp.productId, sp]));

  const existingByProduct = new Map(sale.items.map((i) => [i.productId, i]));
  const newQtyByProduct = new Map(items.map((i) => [i.productId, i.quantity]));

  return prisma.$transaction(async (tx) => {
    // Reconcile stock for every product that changed quantity (including full removal).
    for (const [productId, existingItem] of existingByProduct) {
      const newQty = newQtyByProduct.get(productId) ?? 0;
      const delta = newQty - existingItem.quantity;
      if (delta === 0) continue;
      await applyInventoryChange(tx, {
        storeId: sale.storeId,
        productId,
        userId,
        type: delta > 0 ? "SALE" : "REFUND",
        quantity: Math.abs(delta),
        reason: `Invoice ${sale.receiptNumber} edited`,
        referenceId: sale.id,
      });
    }
    // Deduct stock for products newly added to the invoice.
    for (const [productId, quantity] of newQtyByProduct) {
      if (!existingByProduct.has(productId) && quantity > 0) {
        await applyInventoryChange(tx, {
          storeId: sale.storeId,
          productId,
          userId,
          type: "SALE",
          quantity,
          reason: `Invoice ${sale.receiptNumber} edited`,
          referenceId: sale.id,
        });
      }
    }

    // Rebuild the line items fresh: keep the original unitPrice for lines that already
    // existed (editing item count shouldn't silently re-price them), price new lines at
    // the product's current effective price.
    const lineItems = items
      .filter((i) => i.quantity > 0)
      .map((item) => {
        const existingItem = existingByProduct.get(item.productId);
        const unitPrice = existingItem ? Number(existingItem.unitPrice) : Number(effectivePrice(storeProductMap.get(item.productId), productMap.get(item.productId)).sellingPrice);
        const discount = existingItem ? Number(existingItem.discount) : 0;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          discount,
          total: round2(unitPrice * item.quantity - discount),
        };
      });

    // `sale.discount` is the combined total recorded at creation (item discounts +
    // order-level discount) — pull the order-level portion back out so it isn't double
    // counted once the (unchanged) per-item discounts are re-summed below.
    const originalItemDiscounts = sale.items.reduce((sum, i) => sum + Number(i.discount), 0);
    const orderLevelDiscount = Number(sale.discount) - originalItemDiscounts;

    const taxRate = Number(organization?.taxRate ?? 0);
    const totals = calculateTotals({ lineItems, discount: orderLevelDiscount, taxRate });

    await tx.saleItem.deleteMany({ where: { saleId: sale.id } });
    // Keep the payment record in sync so it still sums to the sale's new total.
    await tx.payment.updateMany({ where: { saleId: sale.id }, data: { amount: totals.total } });

    return tx.sale.update({
      where: { id: sale.id },
      data: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        editedAt: new Date(),
        editedByUserId: userId,
        items: { create: lineItems },
      },
      include: SALE_INCLUDE,
    });
  });
}
