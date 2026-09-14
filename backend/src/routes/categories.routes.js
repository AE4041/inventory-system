import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { categorySchema } from "../utils/schemas.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listCategories);
router.post("/", authorize("ADMIN", "MANAGER"), validateBody(categorySchema), createCategory);
router.patch("/:id", authorize("ADMIN", "MANAGER"), validateBody(categorySchema.partial()), updateCategory);
router.delete("/:id", authorize("ADMIN"), deleteCategory);

export default router;
