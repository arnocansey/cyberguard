import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogsCsv,
  getScheduler,
  getSummary,
  getUsers,
  getUsersCsv,
  patchUserRole,
  runSchedulerTask
} from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";
import { runSchedulerTaskSchema, updateUserRoleSchema } from "../docs/admin.schemas.js";
import { validate } from "../middleware/validation.middleware.js";

const router = Router();

router.get("/summary", authenticate, authorize("ADMIN"), auditLogger("admin.summary"), getSummary);
router.get("/users", authenticate, authorize("ADMIN"), auditLogger("admin.users"), getUsers);
router.get("/users/export", authenticate, authorize("ADMIN"), auditLogger("admin.users.export"), getUsersCsv);
router.patch(
  "/users/:id/role",
  authenticate,
  authorize("ADMIN"),
  auditLogger("admin.users.role", { logSuccess: true }),
  validate(updateUserRoleSchema),
  patchUserRole
);
router.get("/audit-logs", authenticate, authorize("ADMIN"), auditLogger("admin.auditLogs"), getAuditLogs);
router.get("/audit-logs/export", authenticate, authorize("ADMIN"), auditLogger("admin.auditLogs.export"), getAuditLogsCsv);
router.get("/scheduler", authenticate, authorize("ADMIN"), auditLogger("admin.scheduler.status"), getScheduler);
router.post(
  "/scheduler/run",
  authenticate,
  authorize("ADMIN"),
  auditLogger("admin.scheduler.run", { logSuccess: true }),
  validate(runSchedulerTaskSchema),
  runSchedulerTask
);

export default router;