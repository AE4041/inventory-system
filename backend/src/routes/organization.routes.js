import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { getOrganization, updateOrganization } from "../controllers/organization.controller.js";

const router = Router();

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  currency: z.string().min(1).max(6).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

router.use(authenticate);

router.get("/", getOrganization);
router.patch("/", authorize("ADMIN"), validateBody(updateSchema), updateOrganization);

export default router;
