import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { bankAccountSchema, bankTransactionSchema } from "../utils/schemas.js";
import {
  getBankAccounts,
  addBankAccount,
  editBankAccount,
  getBankTransactions,
  addBankTransaction,
  removeBankTransaction,
} from "../controllers/bankAccount.controller.js";

const router = Router();

// Admin-only, org-wide — cash-flow tracking isn't scoped to a single store.
router.use(authenticate, authorize("ADMIN"));

router.get("/", getBankAccounts);
router.post("/", validateBody(bankAccountSchema), addBankAccount);
router.patch("/:id", validateBody(bankAccountSchema.partial()), editBankAccount);
router.get("/:id/transactions", getBankTransactions);
router.post("/:id/transactions", validateBody(bankTransactionSchema), addBankTransaction);
router.delete("/transactions/:transactionId", removeBankTransaction);

export default router;
