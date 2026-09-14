import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { expenseCategorySchema } from "../utils/schemas.js";
import {
  listExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expenseCategories.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listExpenseCategories);
router.post("/", authorize("ADMIN", "MANAGER"), validateBody(expenseCategorySchema), createExpenseCategory);
router.patch("/:id", authorize("ADMIN", "MANAGER"), validateBody(expenseCategorySchema.partial()), updateExpenseCategory);
router.delete("/:id", authorize("ADMIN"), deleteExpenseCategory);

export default router;
