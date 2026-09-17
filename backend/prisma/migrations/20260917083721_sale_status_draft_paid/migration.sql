-- Add new SaleStatus enum values (Postgres requires these to be committed before they
-- can be used by any UPDATE/INSERT, hence the separate backfill migration that follows).
ALTER TYPE "SaleStatus" ADD VALUE 'DRAFT';
ALTER TYPE "SaleStatus" ADD VALUE 'PAID';

-- AlterTable: new columns for the admin item-edit audit trail
ALTER TABLE "Sale" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "editedByUserId" TEXT;
