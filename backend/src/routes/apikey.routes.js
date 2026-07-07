import { Router } from "express";
import { createKey, deleteKey, getKeys } from "../controllers/apikey.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.post("/", auditLogger("apikey.create", { logSuccess: true }), createKey);
router.get("/", auditLogger("apikey.list"), getKeys);
router.delete("/:id", auditLogger("apikey.revoke", { logSuccess: true }), deleteKey);

export default router;
