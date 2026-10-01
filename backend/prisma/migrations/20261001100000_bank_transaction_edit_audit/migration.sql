-- Lets a bank transaction be corrected within a time window, with a mandatory audit trail
-- (who edited it, when, and why) — same bare-scalar pattern as Sale.editedAt/editedByUserId.
ALTER TABLE "BankTransaction" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "BankTransaction" ADD COLUMN "editedById" TEXT;
ALTER TABLE "BankTransaction" ADD COLUMN "editReason" TEXT;
