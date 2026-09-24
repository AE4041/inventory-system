-- Dates the Accounts Sheet report's "loss" row on the day a refund actually happened.
ALTER TABLE "Sale" ADD COLUMN "refundedAt" TIMESTAMP(3);

-- Backfill: for sales that were already REFUNDED before this column existed, updatedAt
-- is the best available proxy (refundSale() only ever updates the row once, to flip
-- status -> REFUNDED, so updatedAt already reflects that exact moment).
UPDATE "Sale" SET "refundedAt" = "updatedAt" WHERE "status" = 'REFUNDED';
