import { Router } from "express";
import { getAlerts, patchAlert } from "../controllers/alerts.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("alerts.list"), getAlerts);
router.patch("/:id", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("alerts.patch", { logSuccess: true }), patchAlert);

export default router;
