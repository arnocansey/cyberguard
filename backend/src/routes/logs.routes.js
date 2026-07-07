import { Router } from "express";
import multer from "multer";
import { deleteLogs, getLog, listLogs, uploadLogs } from "../controllers/logs.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  authenticate,
  authorize("ADMIN", "SECURITY_ANALYST"),
  auditLogger("logs.upload", { logSuccess: true }),
  upload.single("file"),
  uploadLogs
);
router.get("/", authenticate, auditLogger("logs.list"), listLogs);
router.delete(
  "/",
  authenticate,
  authorize("ADMIN", "SECURITY_ANALYST"),
  auditLogger("logs.clear", { logSuccess: true }),
  deleteLogs
);
router.get("/:id", authenticate, auditLogger("logs.get"), getLog);

export default router;
