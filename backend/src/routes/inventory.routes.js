import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { inventoryAdjustmentSchema } from "../utils/schemas.js";
import {
  listStock,
  listInventoryHistory,
  createAdjustment,
  getStockValuation,
} from "../controllers/inventory.controller.js";

const router = Router();

router.use(authenticate);

router.get("/stock", listStock);
router.get("/valuation", getStockValuation);
router.get("/history", listInventoryHistory);
router.post("/adjustments", authorize("ADMIN", "MANAGER"), validateBody(inventoryAdjustmentSchema), createAdjustment);

export default router;
