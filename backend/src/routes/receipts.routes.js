import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getReceiptPdf, emailReceipt } from "../controllers/receipts.controller.js";

const router = Router();

router.use(authenticate);

router.get("/:saleId/pdf", getReceiptPdf);
router.post("/:saleId/email", emailReceipt);

export default router;
