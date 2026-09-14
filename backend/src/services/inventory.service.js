import { ApiError } from "../utils/apiError.js";

const DECREASING_TYPES = new Set(["DEDUCTION", "SALE", "TRANSFER_OUT"]);
const INCREASING_TYPES = new Set(["ADDITION", "REFUND", "TRANSFER_IN"]);

/**
 * Applies a stock change for one product at one store and writes the audit trail row.
 * Must be called with a Prisma transaction client (`tx`) so it stays atomic with
 * whatever business operation triggered it (a sale, a refund, a transfer leg, etc).
 *
 * `quantity` is always a positive number for ADDITION/DEDUCTION/SALE/REFUND/TRANSFER_*.
 * For ADJUSTMENT, `quantity` is the new absolute stock count (a physical stock-take value).
 */
export async function applyInventoryChange(tx, { storeId, productId, userId, type, quantity, reason, referenceId, allowNegative = false }) {
  let previousQuantity, newQuantity, loggedQuantity;

  if (type === "ADJUSTMENT") {
    // Absolute set — the previous count can't be inferred from the delta, so this needs
    // a read before the write. Adjustments are a manual stock-take action, not part of
    // the checkout hot path, so the extra round trip here doesn't matter for POS speed.
    const storeProduct = await tx.storeProduct.upsert({
      where: { storeId_productId: { storeId, productId } },
      create: { storeId, productId, quantity: 0 },
      update: {},
    });
    previousQuantity = storeProduct.quantity;
    newQuantity = quantity;
    loggedQuantity = newQuantity - previousQuantity;

    if (newQuantity < 0 && !allowNegative) {
      throw ApiError.badRequest("This action would make stock negative. Not enough stock available.");
    }
    await tx.storeProduct.update({ where: { id: storeProduct.id }, data: { quantity: newQuantity } });
  } else if (INCREASING_TYPES.has(type) || DECREASING_TYPES.has(type)) {
    // Hot path (sales, refunds, transfers): fold the read-then-write into one atomic
    // upsert using an increment/decrement, since the delta is already known. This halves
    // the round trips per line item compared to reading the row first, which matters a
    // lot on a sale with several items against a higher-latency hosted database.
    const delta = INCREASING_TYPES.has(type) ? quantity : -quantity;
    loggedQuantity = quantity;

    const storeProduct = await tx.storeProduct.upsert({
      where: { storeId_productId: { storeId, productId } },
      create: { storeId, productId, quantity: delta },
      update: { quantity: { increment: delta } },
    });
    newQuantity = storeProduct.quantity;
    previousQuantity = newQuantity - delta;

    if (newQuantity < 0 && !allowNegative) {
      // Throwing here rolls back the whole enclosing transaction, so the negative
      // value written just above never actually persists.
      throw ApiError.badRequest("This action would make stock negative. Not enough stock available.");
    }
  } else {
    throw ApiError.badRequest(`Unknown inventory transaction type: ${type}`);
  }

  return tx.inventoryTransaction.create({
    data: {
      storeId,
      productId,
      userId,
      type,
      quantity: loggedQuantity,
      previousQuantity,
      newQuantity,
      reason: reason || null,
      referenceId: referenceId || null,
    },
  });
}
