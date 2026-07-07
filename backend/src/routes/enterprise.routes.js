import { Router } from "express";
import {
  getAssetsController,
  getComplianceController,
  getIocMatches,
  getIocs,
  getMlDriftController,
  getPlaybooks,
  getReportSchedulesController,
  getRuleVersionsController,
  getUeba,
  postAssetController,
  postIocs,
  postMlFeedbackController,
  postReportScheduleController,
  postRuleVersionController,
  postRunPlaybook
} from "../controllers/enterprise.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/soar/playbooks", authenticate, auditLogger("soar.playbooks.list"), getPlaybooks);
router.post("/soar/run", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("soar.playbook.run", { logSuccess: true }), postRunPlaybook);

router.get("/threat-intel/iocs", authenticate, auditLogger("ioc.list"), getIocs);
router.post("/threat-intel/iocs", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("ioc.ingest", { logSuccess: true }), postIocs);
router.get("/threat-intel/matches", authenticate, auditLogger("ioc.matches"), getIocMatches);

router.get("/ueba/anomalies", authenticate, auditLogger("ueba.anomalies"), getUeba);

router.get("/assets", authenticate, auditLogger("assets.list"), getAssetsController);
router.post("/assets", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("assets.create", { logSuccess: true }), postAssetController);

router.get("/compliance/overview", authenticate, authorize("ADMIN"), auditLogger("compliance.overview"), getComplianceController);

router.get("/report-schedules", authenticate, authorize("ADMIN"), auditLogger("reports.schedules.list"), getReportSchedulesController);
router.post("/report-schedules", authenticate, authorize("ADMIN"), auditLogger("reports.schedules.create", { logSuccess: true }), postReportScheduleController);

router.post("/ml/feedback", authenticate, authorize("ADMIN", "SECURITY_ANALYST"), auditLogger("ml.feedback", { logSuccess: true }), postMlFeedbackController);
router.get("/ml/drift", authenticate, authorize("ADMIN"), auditLogger("ml.drift"), getMlDriftController);

router.get("/detection/rules/:ruleId/versions", authenticate, authorize("ADMIN"), auditLogger("detection.versions.list"), getRuleVersionsController);
router.post("/detection/rules/:ruleId/versions", authenticate, authorize("ADMIN"), auditLogger("detection.versions.create", { logSuccess: true }), postRuleVersionController);

export default router;
