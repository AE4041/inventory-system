import { prisma } from "../lib/prisma.js";
import { createSale } from "./sales.service.js";
import { getOrCreateSystemUser } from "./systemUser.service.js";
import { effectivePrice } from "../utils/pricing.js";

const VOUCHER_SALE_PAYMENT_METHOD = "MOBILE_MONEY";

// Server-local calendar-day key (not just the raw date, since redeemedAt is a full
// timestamp) — this is what lets a recovery run split a multi-day backlog into one Sale
// per day instead of merging everything into a single lump.
function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Rolls up one store's not-yet-invoiced voucher redemptions into one Sale per (day,
// product) — normally that's "today's redemptions for this plan", but if a close-day
// trigger was missed (router power loss, etc.) and redemptions from several different
// days are still pending, each day gets its own Sale, backdated to when those redemptions
// actually happened, rather than one Sale merging every pending day together under today's
// date. Stock was already deducted in real time as each voucher was redeemed, so the sale
// is created with skipInventory — this only records the revenue, it doesn't touch stock again.
export async function closeOutStore(storeId) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return { storeId, sales: [] };

  const pending = await prisma.voucherRedemption.findMany({
    where: { storeId, saleId: null },
    include: { product: true },
    orderBy: { redeemedAt: "asc" },
  });
  if (pending.length === 0) return { storeId, sales: [] };

  const groups = new Map();
  for (const redemption of pending) {
    const key = `${dayKey(redemption.redeemedAt)}::${redemption.productId}`;
    const group = groups.get(key) ?? { product: redemption.product, redemptionIds: [], lastRedeemedAt: redemption.redeemedAt };
    group.redemptionIds.push(redemption.id);
    if (redemption.redeemedAt > group.lastRedeemedAt) group.lastRedeemedAt = redemption.redeemedAt;
    groups.set(key, group);
  }

  const systemUser = await getOrCreateSystemUser(store.organizationId);
  const sales = [];

  for (const group of groups.values()) {
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { storeId_productId: { storeId, productId: group.product.id } },
    });
    const { sellingPrice } = effectivePrice(storeProduct, group.product);
    const quantity = group.redemptionIds.length;

    const sale = await createSale({
      organizationId: store.organizationId,
      storeId,
      userId: systemUser.id,
      customerId: null,
      items: [{ productId: group.product.id, quantity, unitPrice: Number(sellingPrice), discount: 0 }],
      discount: 0,
      paymentMethod: VOUCHER_SALE_PAYMENT_METHOD,
      source: "MIKROTIK",
      skipInventory: true,
      // Backdate to when these redemptions actually happened, not whenever the recovery
      // run happens to execute — otherwise a caught-up backlog would all show as "today".
      createdAt: group.lastRedeemedAt,
    });

    await prisma.voucherRedemption.updateMany({
      where: { id: { in: group.redemptionIds } },
      data: { saleId: sale.id },
    });

    sales.push(sale);
  }

  return { storeId, sales };
}

// Called by the Vercel Cron fallback (and the in-process job, for non-serverless
// deployments) — finds every store with unbilled redemptions, regardless of organization,
// and closes each one out. Safe to call even when nothing is pending (no-ops per store).
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
