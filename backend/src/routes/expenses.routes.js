import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { expenseSchema } from "../utils/schemas.js";
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenses.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listExpenses);
router.get("/:id", getExpense);
router.post("/", validateBody(expenseSchema), createExpense);
router.patch("/:id", validateBody(expenseSchema.partial().omit({ storeId: true })), updateExpense);
router.delete("/:id", deleteExpense);

export default router;
