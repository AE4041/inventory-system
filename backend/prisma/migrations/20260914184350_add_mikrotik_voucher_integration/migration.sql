-- CreateEnum
CREATE TYPE "SaleSource" AS ENUM ('POS', 'MIKROTIK');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "source" "SaleSource" NOT NULL DEFAULT 'POS';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "mikrotikToken" TEXT;

-- CreateTable
CREATE TABLE "VoucherProfileMapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "profileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherProfileMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherRedemption" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "profile" TEXT NOT NULL,
    "voucherCode" TEXT,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoucherProfileMapping_productId_key" ON "VoucherProfileMapping"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherProfileMapping_organizationId_profileName_key" ON "VoucherProfileMapping"("organizationId", "profileName");

-- CreateIndex
CREATE INDEX "VoucherRedemption_storeId_productId_saleId_idx" ON "VoucherRedemption"("storeId", "productId", "saleId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_redeemedAt_idx" ON "VoucherRedemption"("redeemedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Store_mikrotikToken_key" ON "Store"("mikrotikToken");

-- AddForeignKey
ALTER TABLE "VoucherProfileMapping" ADD CONSTRAINT "VoucherProfileMapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherProfileMapping" ADD CONSTRAINT "VoucherProfileMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
