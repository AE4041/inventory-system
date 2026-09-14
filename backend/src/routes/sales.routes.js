import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createSaleSchema } from "../utils/schemas.js";
import {
  listSales,
  getSale,
  createSaleHandler,
  refundSaleHandler,
  cancelSaleHandler,
} from "../controllers/sales.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listSales);
router.get("/:id", getSale);
router.post("/", validateBody(createSaleSchema), createSaleHandler);
router.post("/:id/refund", authorize("ADMIN", "MANAGER"), refundSaleHandler);
router.post("/:id/cancel", authorize("ADMIN", "MANAGER"), cancelSaleHandler);

export default router;
