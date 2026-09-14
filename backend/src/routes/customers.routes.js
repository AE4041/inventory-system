import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { customerSchema } from "../utils/schemas.js";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listCustomers);
router.get("/:id", getCustomer);
router.post("/", validateBody(customerSchema), createCustomer);
router.patch("/:id", validateBody(customerSchema.partial().omit({ storeId: true })), updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
