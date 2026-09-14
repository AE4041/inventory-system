import { prisma } from "../lib/prisma.js";
import { createSale } from "./sales.service.js";
import { getOrCreateSystemUser } from "./systemUser.service.js";
import { effectivePrice } from "../utils/pricing.js";

const VOUCHER_SALE_PAYMENT_METHOD = "MOBILE_MONEY";

// Rolls up one store's not-yet-invoiced voucher redemptions into one Sale per product
// (matching the "one aggregated sale per plan per day" choice). Stock was already deducted
// in real time as each voucher was redeemed, so the sale is created with skipInventory —
// this only records the revenue, it doesn't touch stock again.
export async function closeOutStore(storeId) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return { storeId, sales: [] };

  const pending = await prisma.voucherRedemption.findMany({
    where: { storeId, saleId: null },
    include: { product: true },
  });
  if (pending.length === 0) return { storeId, sales: [] };

  const byProduct = new Map();
  for (const redemption of pending) {
    const group = byProduct.get(redemption.productId) ?? { product: redemption.product, redemptionIds: [] };
    group.redemptionIds.push(redemption.id);
    byProduct.set(redemption.productId, group);
  }

  const systemUser = await getOrCreateSystemUser(store.organizationId);
  const sales = [];

  for (const [productId, group] of byProduct) {
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { storeId_productId: { storeId, productId } },
    });
    const { sellingPrice } = effectivePrice(storeProduct, group.product);
    const quantity = group.redemptionIds.length;

    const sale = await createSale({
      organizationId: store.organizationId,
      storeId,
      userId: systemUser.id,
      customerId: null,
      items: [{ productId, quantity, unitPrice: Number(sellingPrice), discount: 0 }],
      discount: 0,
      paymentMethod: VOUCHER_SALE_PAYMENT_METHOD,
      source: "MIKROTIK",
      skipInventory: true,
    });

    await prisma.voucherRedemption.updateMany({
      where: { id: { in: group.redemptionIds } },
      data: { saleId: sale.id },
    });

    sales.push(sale);
  }

  return { storeId, sales };
}

// Called by the nightly cron job — finds every store with unbilled redemptions (regardless
// of organization) and closes each one out.
export async function closeOutAllStores() {
  const storeIds = await prisma.voucherRedemption.findMany({
    where: { saleId: null },
    distinct: ["storeId"],
    select: { storeId: true },
  });

  const results = [];
  for (const { storeId } of storeIds) {
    results.push(await closeOutStore(storeId));
  }
  return results;
}
