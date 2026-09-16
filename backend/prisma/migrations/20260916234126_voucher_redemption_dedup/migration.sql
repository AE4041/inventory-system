-- Postgres treats NULL as distinct in unique indexes, so this only dedupes real voucher
-- codes reported by the router; manual redemptions (voucherCode IS NULL) are unaffected.
CREATE UNIQUE INDEX "VoucherRedemption_storeId_voucherCode_key" ON "VoucherRedemption"("storeId", "voucherCode");
