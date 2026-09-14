import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  salesReport,
  expensesReport,
  inventoryReport,
  productPerformanceReport,
  storePerformanceReport,
} from "../controllers/reports.controller.js";

const router = Router();

router.use(authenticate);

router.get("/sales", salesReport);
router.get("/expenses", expensesReport);
router.get("/inventory", inventoryReport);
router.get("/products", productPerformanceReport);
router.get("/stores", storePerformanceReport);

export default router;
