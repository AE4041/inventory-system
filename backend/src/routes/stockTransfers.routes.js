import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { stockTransferSchema } from "../utils/schemas.js";
import {
  listStockTransfers,
  createStockTransfer,
  completeStockTransfer,
  cancelStockTransfer,
} from "../controllers/stockTransfers.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listStockTransfers);
router.post("/", authorize("ADMIN", "MANAGER"), validateBody(stockTransferSchema), createStockTransfer);
router.post("/:id/complete", authorize("ADMIN", "MANAGER"), completeStockTransfer);
router.post("/:id/cancel", authorize("ADMIN", "MANAGER"), cancelStockTransfer);

export default router;
