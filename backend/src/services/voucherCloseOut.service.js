import { prisma } from "../lib/prisma.js";
import { createSale } from "./sales.service.js";
import { getOrCreateSystemUser } from "./systemUser.service.js";
import { applyInventoryChange } from "./inventory.service.js";
import { effectivePrice } from "../utils/pricing.js";
import { ApiError } from "../utils/apiError.js";

const VOUCHER_SALE_PAYMENT_METHOD = "MOBILE_MONEY";

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Server-local calendar-day key (not just the raw date, since redeemedAt is a full
// timestamp) — this is what lets a recovery run split a multi-day backlog into one Sale
// per day instead of merging everything into a single lump.
function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Rolls up one store's not-yet-invoiced voucher redemptions into one Sale per day —
// normally that's "today's redemptions", with one line item per plan sold (2hours,
// 5hours, etc.) and a single grand total, same as a normal multi-item POS receipt. If a
// close-day trigger was missed (router power loss, etc.) and redemptions from several
// different days are still pending, each day still gets its own Sale, backdated to when
// those redemptions actually happened, rather than one Sale merging every pending day
// together under today's date. Stock was already deducted in real time as each voucher
// was redeemed, so the sale is created with skipInventory — this only records the
// revenue, it doesn't touch stock again.
export async function closeOutStore(storeId) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return { storeId, sales: [] };

  const pending = await prisma.voucherRedemption.findMany({
    where: { storeId, saleId: null },
    include: { product: true },
    orderBy: { redeemedAt: "asc" },
  });
  if (pending.length === 0) return { storeId, sales: [] };

  const dayGroups = new Map();
  for (const redemption of pending) {
    const key = dayKey(redemption.redeemedAt);
    const group = dayGroups.get(key) ?? { redemptionIds: [], lastRedeemedAt: redemption.redeemedAt, byProduct: new Map() };
    group.redemptionIds.push(redemption.id);
    if (redemption.redeemedAt > group.lastRedeemedAt) group.lastRedeemedAt = redemption.redeemedAt;

    const productGroup = group.byProduct.get(redemption.productId) ?? { product: redemption.product, quantity: 0 };
    productGroup.quantity += 1;
    group.byProduct.set(redemption.productId, productGroup);

    dayGroups.set(key, group);
  }

  const systemUser = await getOrCreateSystemUser(store.organizationId);
  const sales = [];

  for (const group of dayGroups.values()) {
    const items = [];
    for (const { product, quantity } of group.byProduct.values()) {
      const storeProduct = await prisma.storeProduct.findUnique({
        where: { storeId_productId: { storeId, productId: product.id } },
      });
      const { sellingPrice } = effectivePrice(storeProduct, product);
      items.push({ productId: product.id, quantity, unitPrice: Number(sellingPrice), discount: 0 });
    }

    const sale = await createSale({
      organizationId: store.organizationId,
      storeId,
      userId: systemUser.id,
      customerId: null,
      items,
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

// Read-only preview of what today's close-out would produce for one store — the "MikroTik
// cart" on the POS screen. Deliberately scoped to today only: a multi-day backlog is a rare
// recovery case already handled correctly by closeOutStore/the cron fallback, not something
// this live running-total view needs to manage — it's just surfaced as a count so nothing
// pending is silently invisible.
export async function getPendingVoucherSummary(storeId) {
  const start = startOfToday();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const [todayRedemptions, olderPendingCount] = await Promise.all([
    prisma.voucherRedemption.findMany({
      where: { storeId, saleId: null, redeemedAt: { gte: start, lt: end } },
      include: { product: true },
      orderBy: { redeemedAt: "asc" },
    }),
    prisma.voucherRedemption.count({ where: { storeId, saleId: null, redeemedAt: { lt: start } } }),
  ]);

  const byProduct = new Map();
  for (const redemption of todayRedemptions) {
    const group = byProduct.get(redemption.productId) ?? { product: redemption.product, redemptions: [] };
    group.redemptions.push(redemption);
    byProduct.set(redemption.productId, group);
  }

  const items = [];
  for (const { product, redemptions } of byProduct.values()) {
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { storeId_productId: { storeId, productId: product.id } },
    });
    const { sellingPrice } = effectivePrice(storeProduct, product);
    const unitPrice = Number(sellingPrice);
    const quantity = redemptions.length;
    items.push({
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity,
      total: round2(unitPrice * quantity),
      redemptions: redemptions.map((r) => ({ id: r.id, voucherCode: r.voucherCode, profile: r.profile, redeemedAt: r.redeemedAt })),
    });
  }
  items.sort((a, b) => a.productName.localeCompare(b.productName));

  return { items, grandTotal: round2(items.reduce((sum, item) => sum + item.total, 0)), olderPendingCount };
}

// Manually adds `quantity` voucher "redemptions" for a product that wasn't reported by the
// router (e.g. sold by hand at the counter) — deducts stock immediately and inserts plain
// VoucherRedemption rows with no voucherCode, exactly like a real webhook call, so they flow
// through the same close-out/day-grouping logic as everything else.
export async function addManualVoucherRedemptions({ storeId, productId, quantity, userId, note }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("Product not found");

  const mapping = await prisma.voucherProfileMapping.findUnique({ where: { productId } });
  const profile = mapping?.profileName || product.name;

  const created = [];
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < quantity; i++) {
      await applyInventoryChange(tx, {
        storeId,
        productId,
        userId,
        type: "SALE",
        quantity: 1,
        reason: note || `Manually added voucher sale (${profile})`,
      });
      created.push(await tx.voucherRedemption.create({ data: { storeId, productId, profile, voucherCode: null } }));
    }
  });

  return created;
}

// Removes one pending (not-yet-closed-out) redemption from today's count — e.g. a mistaken
// or duplicate entry — and restores the stock unit that was deducted when it was redeemed,
// so the store's stock count stays accurate. Refuses once a redemption has already been
// rolled into a Sale, since that revenue is already booked.
export async function removePendingVoucherRedemption({ redemptionId, userId }) {
  const redemption = await prisma.voucherRedemption.findUnique({ where: { id: redemptionId } });
  if (!redemption) throw ApiError.notFound("Voucher redemption not found");
  if (redemption.saleId) throw ApiError.badRequest("This voucher has already been closed out into a sale and can no longer be edited");

  await prisma.$transaction(async (tx) => {
    await applyInventoryChange(tx, {
      storeId: redemption.storeId,
      productId: redemption.productId,
      userId,
      type: "REFUND",
      quantity: 1,
      reason: `Removed from MikroTik close-out cart${redemption.voucherCode ? ` (voucher ${redemption.voucherCode})` : ""}`,
    });
    await tx.voucherRedemption.delete({ where: { id: redemption.id } });
  });

  return redemption;
}
