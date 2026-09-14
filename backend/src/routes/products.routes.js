import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { productSchema, storePriceSchema } from "../utils/schemas.js";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  setProductStorePrice,
  deleteProduct,
} from "../controllers/products.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", authorize("ADMIN", "MANAGER"), validateBody(productSchema), createProduct);
router.patch("/:id", authorize("ADMIN", "MANAGER"), validateBody(productSchema.partial()), updateProduct);
router.patch("/:id/price", authorize("ADMIN", "MANAGER"), validateBody(storePriceSchema), setProductStorePrice);
router.delete("/:id", authorize("ADMIN"), deleteProduct);

export default router;
