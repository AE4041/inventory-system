import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { applyInventoryChange } from "../services/inventory.service.js";
import { getOrCreateSystemUser } from "../services/systemUser.service.js";
import { closeOutStore, closeOutAllStores } from "../services/voucherCloseOut.service.js";

async function resolveProduct(organizationId, profileName) {
  const mapping = await prisma.voucherProfileMapping.findUnique({
    where: { organizationId_profileName: { organizationId, profileName } },
  });
  if (!mapping) {
    throw ApiError.badRequest(`No product is mapped to the MikroTik profile "${profileName}" yet`);
  }
  return mapping.productId;
}

// Called by the router (or the script relaying its hotspot events) whenever a batch of
// vouchers is generated for a profile — adds that many units to the store's stock.
export const voucherGenerated = asyncHandler(async (req, res) => {
  const { profile, quantity, reason } = req.body;
  if (!profile || !quantity || quantity <= 0) throw ApiError.badRequest("profile and a positive quantity are required");

  const store = req.store;
  const productId = await resolveProduct(store.organizationId, profile);
  const systemUser = await getOrCreateSystemUser(store.organizationId);

  const transaction = await prisma.$transaction((tx) =>
    applyInventoryChange(tx, {
      storeId: store.id,
      productId,
      userId: systemUser.id,
      type: "ADDITION",
      quantity,
      reason: reason || `${quantity} MikroTik voucher(s) generated (${profile})`,
    })
  );

  res.status(201).json({ success: true, data: transaction });
});

// Called on every hotspot login — records the redemption and deducts one unit of stock
// immediately (so "vouchers remaining" stays accurate through the day). The revenue itself
// is only booked once the nightly close-out rolls this into a Sale.
export const voucherRedeemed = asyncHandler(async (req, res) => {
  const { profile, voucherCode } = req.body;
  if (!profile) throw ApiError.badRequest("profile is required");

  const store = req.store;
  const productId = await resolveProduct(store.organizationId, profile);
  const systemUser = await getOrCreateSystemUser(store.organizationId);

  const redemption = await prisma.$transaction(async (tx) => {
    await applyInventoryChange(tx, {
      storeId: store.id,
      productId,
      userId: systemUser.id,
      type: "SALE",
      quantity: 1,
      reason: `Voucher redeemed (${profile})${voucherCode ? ` - ${voucherCode}` : ""}`,
    });

    return tx.voucherRedemption.create({
      data: { storeId: store.id, productId, profile, voucherCode: voucherCode || null },
    });
  });

  res.status(201).json({ success: true, data: redemption });
});

// --- Admin-facing: profile <-> product mapping, token management, manual close-out ---

export const listMappings = asyncHandler(async (req, res) => {
  const mappings = await prisma.voucherProfileMapping.findMany({
    where: { organizationId: req.user.organizationId },
    include: { product: true },
    orderBy: { profileName: "asc" },
  });
  res.json({ success: true, data: mappings });
});

export const upsertMapping = asyncHandler(async (req, res) => {
  const { profileName, productId } = req.body;
  if (!profileName || !productId) throw ApiError.badRequest("profileName and productId are required");

  const product = await prisma.product.findFirst({ where: { id: productId, organizationId: req.user.organizationId } });
  if (!product) throw ApiError.notFound("Product not found");

  const mapping = await prisma.voucherProfileMapping.upsert({
    where: { organizationId_profileName: { organizationId: req.user.organizationId, profileName } },
    create: { organizationId: req.user.organizationId, profileName, productId },
    update: { productId },
    include: { product: true },
  });

  res.status(201).json({ success: true, data: mapping });
});

export const deleteMapping = asyncHandler(async (req, res) => {
  const existing = await prisma.voucherProfileMapping.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  if (!existing) throw ApiError.notFound("Mapping not found");
  await prisma.voucherProfileMapping.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { id: existing.id } });
});

// Manual/external-cron-friendly trigger — closes out every store in the caller's
// organization right now, instead of waiting for the nightly schedule. Useful for a first
// run, for testing, or if you're deploying serverless and wiring this to an external
// scheduler (e.g. Vercel Cron) instead of the in-process job.
// Called directly by a router's own end-of-day script (the same one that already sends
// your Telegram summary), authenticated by that store's token. This is the primary way
// close-out happens — it fires at exactly your existing EOD schedule, not a guessed time.
export const closeStoreDay = asyncHandler(async (req, res) => {
  const result = await closeOutStore(req.store.id);
  res.json({ success: true, data: result });
});

export const closeDay = asyncHandler(async (req, res) => {
  const stores = await prisma.store.findMany({ where: { organizationId: req.user.organizationId }, select: { id: true } });
  const results = [];
  for (const store of stores) {
    results.push(await closeOutStore(store.id));
  }
  res.json({ success: true, data: results });
});

// Same as closeDay but for every organization — this is what the nightly cron calls, and
// it's also exposed so an external scheduler can hit one endpoint instead of one per org.
export const closeDayAll = asyncHandler(async (req, res) => {
  const results = await closeOutAllStores();
  res.json({ success: true, data: results });
});
