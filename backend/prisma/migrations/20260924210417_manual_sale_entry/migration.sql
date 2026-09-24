-- Hand-entered revenue lines for the Accounts Sheet report (off-books sales with no
-- real Product/stock transaction behind them).
CREATE TABLE "ManualSaleEntry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualSaleEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManualSaleEntry_storeId_date_idx" ON "ManualSaleEntry"("storeId", "date");

ALTER TABLE "ManualSaleEntry" ADD CONSTRAINT "ManualSaleEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManualSaleEntry" ADD CONSTRAINT "ManualSaleEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
