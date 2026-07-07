import { Router } from "express";
import { downloadReport, getReports } from "../controllers/reports.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();
router.get("/", authenticate, auditLogger("reports.list"), getReports);
router.get("/:id/download", authenticate, auditLogger("reports.download", { logSuccess: true }), downloadReport);

export default router;
