import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { manualSaleEntrySchema } from "../utils/schemas.js";
import {
  salesReport,
  expensesReport,
  inventoryReport,
  productPerformanceReport,
  storePerformanceReport,
} from "../controllers/reports.controller.js";
import {
  getAccountsSheet,
  getAccountsSheetPdf,
  addManualSaleEntry,
  removeManualSaleEntry,
} from "../controllers/accountsSheet.controller.js";

const router = Router();

router.use(authenticate);

router.get("/sales", salesReport);
router.get("/expenses", expensesReport);
router.get("/inventory", inventoryReport);
router.get("/products", productPerformanceReport);
router.get("/stores", storePerformanceReport);
router.get("/accounts-sheet", getAccountsSheet);
router.get("/accounts-sheet/pdf", getAccountsSheetPdf);
router.post("/accounts-sheet/manual-entries", validateBody(manualSaleEntrySchema), addManualSaleEntry);
router.delete("/accounts-sheet/manual-entries/:id", removeManualSaleEntry);

export default router;
