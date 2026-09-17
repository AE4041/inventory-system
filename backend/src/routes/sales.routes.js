import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createSaleSchema, updateSaleItemsSchema } from "../utils/schemas.js";
import {
  listSales,
  getSale,
  createSaleHandler,
  refundSaleHandler,
  cancelSaleHandler,
  markSalePaidHandler,
  updateSaleItemsHandler,
} from "../controllers/sales.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listSales);
router.get("/:id", getSale);
router.post("/", validateBody(createSaleSchema), createSaleHandler);
router.post("/:id/refund", authorize("ADMIN", "MANAGER"), refundSaleHandler);
router.post("/:id/cancel", authorize("ADMIN", "MANAGER"), cancelSaleHandler);
router.post("/:id/mark-paid", authorize("ADMIN", "MANAGER"), markSalePaidHandler);
router.patch("/:id/items", authorize("ADMIN"), validateBody(updateSaleItemsSchema), updateSaleItemsHandler);

export default router;
