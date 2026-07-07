import { Router } from "express";
import {
  getCorrelationRules,
  patchCorrelationRule,
  postCorrelationRule,
  removeCorrelationRule,
  simulateCorrelationRuleController
} from "../controllers/correlation.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("correlation.list"), getCorrelationRules);
router.post("/", authenticate, authorize("ADMIN"), auditLogger("correlation.create", { logSuccess: true }), postCorrelationRule);
router.patch("/:id", authenticate, authorize("ADMIN"), auditLogger("correlation.update", { logSuccess: true }), patchCorrelationRule);
router.delete("/:id", authenticate, authorize("ADMIN"), auditLogger("correlation.delete", { logSuccess: true }), removeCorrelationRule);
router.get("/:id/simulate", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("correlation.simulate"), simulateCorrelationRuleController);

export default router;
