import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { storeSchema } from "../utils/schemas.js";
import { listStores, getStore, createStore, updateStore, getMikrotikStatus, regenerateMikrotikToken } from "../controllers/stores.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listStores);
router.get("/:id", getStore);
router.post("/", authorize("ADMIN"), validateBody(storeSchema), createStore);
router.patch("/:id", authorize("ADMIN"), validateBody(storeSchema.partial()), updateStore);
router.get("/:id/mikrotik-token", authorize("ADMIN"), getMikrotikStatus);
router.post("/:id/mikrotik-token", authorize("ADMIN"), regenerateMikrotikToken);

export default router;
