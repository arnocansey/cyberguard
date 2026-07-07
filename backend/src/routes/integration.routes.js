import { Router } from "express";
import { addIntegration, getIntegrations, removeIntegration } from "../controllers/integration.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.post("/", auditLogger("integration.create", { logSuccess: true }), addIntegration);
router.get("/", auditLogger("integration.list"), getIntegrations);
router.delete("/:id", auditLogger("integration.revoke", { logSuccess: true }), removeIntegration);

export default router;
