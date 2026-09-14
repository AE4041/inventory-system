import { Router } from "express";
import { registerOrganization, login, me } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { registerOrgSchema, loginSchema } from "../utils/schemas.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", validateBody(registerOrgSchema), registerOrganization);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", authenticate, me);

export default router;
