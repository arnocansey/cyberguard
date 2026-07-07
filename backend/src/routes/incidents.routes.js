import { Router } from "express";
import { getIncidentTimelineController, getIncidents, patchIncident, postIncident } from "../controllers/incidents.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("incidents.create", { logSuccess: true }), postIncident);
router.patch("/:id", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("incidents.update", { logSuccess: true }), patchIncident);
router.get("/", authenticate, auditLogger("incidents.list"), getIncidents);
router.get("/:id/timeline", authenticate, auditLogger("incidents.timeline"), getIncidentTimelineController);

export default router;
