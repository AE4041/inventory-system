import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { authenticateStoreToken } from "../middleware/storeToken.js";
import { requireCronSecret } from "../middleware/cronSecret.js";
import { validateBody } from "../middleware/validate.js";
import {
  voucherGenerated,
  voucherRedeemed,
  listMappings,
  upsertMapping,
  deleteMapping,
  closeStoreDay,
  closeDay,
  closeDayAll,
  getPendingVouchers,
  addPendingVoucher,
  removePendingVoucher,
} from "../controllers/mikrotikIntegration.controller.js";

const router = Router();

const voucherGeneratedSchema = z.object({
  profile: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().optional(),
});

const voucherRedeemedSchema = z.object({
  profile: z.string().min(1),
  voucherCode: z.string().optional(),
});

const mappingSchema = z.object({
  profileName: z.string().min(1),
  productId: z.string(),
});

const addPendingVoucherSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  quantity: z.coerce.number().int().positive().max(500),
  note: z.string().max(200).optional(),
});

// Router-facing webhooks — authenticated by the store's own token, not a user login.
router.post("/vouchers/generated", authenticateStoreToken, validateBody(voucherGeneratedSchema), voucherGenerated);
router.post("/vouchers/redeemed", authenticateStoreToken, validateBody(voucherRedeemedSchema), voucherRedeemed);
router.post("/vouchers/close-day", authenticateStoreToken, closeStoreDay);

// External-scheduler-facing (e.g. Vercel Cron) — every store, every organization.
// Vercel Cron invokes scheduled endpoints with GET; POST is kept too for manual/curl testing.
router.get("/close-day-all", requireCronSecret, closeDayAll);
router.post("/close-day-all", requireCronSecret, closeDayAll);

// Admin-facing, JWT-authenticated.
router.use(authenticate);
router.get("/mappings", authorize("ADMIN", "MANAGER"), listMappings);
router.post("/mappings", authorize("ADMIN", "MANAGER"), validateBody(mappingSchema), upsertMapping);
router.delete("/mappings/:id", authorize("ADMIN"), deleteMapping);
router.post("/close-day", authorize("ADMIN"), closeDay);
router.get("/pending", authorize("ADMIN", "MANAGER"), getPendingVouchers);
router.post("/pending", authorize("ADMIN", "MANAGER"), validateBody(addPendingVoucherSchema), addPendingVoucher);
router.delete("/pending/:id", authorize("ADMIN", "MANAGER"), removePendingVoucher);

export default router;
