import { Router } from "express";
import { ingestLogs } from "../controllers/ingest.controller.js";
import { authenticateApiKey } from "../middleware/apikey.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.post(
  "/",
  authenticateApiKey,
  auditLogger("logs.ingest", { logSuccess: true }),
  ingestLogs
);

export default router;
