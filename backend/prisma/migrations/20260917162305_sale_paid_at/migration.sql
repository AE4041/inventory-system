-- Refund/edit are only allowed within a fixed window after a sale is marked PAID.
ALTER TABLE "Sale" ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill: under the pre-Draft model, COMPLETED (now PAID) meant "paid at creation" —
-- so createdAt is the correct paidAt for every sale that was already PAID before this
-- column existed. Sales marked PAID going forward get a real paidAt from markSalePaid.
UPDATE "Sale" SET "paidAt" = "createdAt" WHERE "status" = 'PAID';
