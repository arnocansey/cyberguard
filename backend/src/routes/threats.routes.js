import { Router } from "express";
import { listThreats, statsThreats } from "../controllers/threats.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", authenticate, auditLogger("threats.list"), listThreats);
router.get("/stats", authenticate, auditLogger("threats.stats"), statsThreats);

export default router;
