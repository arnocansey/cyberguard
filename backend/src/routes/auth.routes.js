import { Router } from "express";
import {
  disable2FaController,
  login,
  logout,
  me,
  refresh,
  register,
  revokeSessionsController,
  setup2FaController,
  verify2FaController
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  verifyTwoFaSchema
} from "../docs/auth.schemas.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register user
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflict
 */
router.post("/register", auditLogger("auth.register"), validate(registerSchema), register);
router.post("/login", auditLogger("auth.login"), validate(loginSchema), login);
router.post("/refresh", auditLogger("auth.refresh"), validate(refreshSchema), refresh);
router.post("/logout", authenticate, auditLogger("auth.logout", { logSuccess: true }), validate(logoutSchema), logout);
router.get("/me", authenticate, auditLogger("auth.me"), me);
router.post("/2fa/setup", authenticate, auditLogger("auth.2fa.setup", { logSuccess: true }), setup2FaController);
router.post("/2fa/verify", authenticate, auditLogger("auth.2fa.verify", { logSuccess: true }), validate(verifyTwoFaSchema), verify2FaController);
router.post("/2fa/disable", authenticate, auditLogger("auth.2fa.disable", { logSuccess: true }), disable2FaController);
router.post("/sessions/revoke-all", authenticate, auditLogger("auth.sessions.revokeAll", { logSuccess: true }), revokeSessionsController);

export default router;
