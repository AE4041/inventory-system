-- Backfill historical COMPLETED sales to PAID (the new enum values are now committed
-- from the prior migration, so they're usable here). COMPLETED is left as a permanently
-- unused label in the physical enum type; Postgres can't cleanly drop an enum value.
UPDATE "Sale" SET status = 'PAID' WHERE status = 'COMPLETED';

-- AlterTable: new sales default to DRAFT instead of the old COMPLETED.
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
