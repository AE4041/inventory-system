import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "../utils/schemas.js";
import { listUsers, createUser, updateUser, deleteUser } from "../controllers/users.controller.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", listUsers);
router.post("/", validateBody(createUserSchema), createUser);
router.patch("/:id", validateBody(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
