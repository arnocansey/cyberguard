import { Router } from "express";
import { postAssist } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.post("/assist", authenticate, auditLogger("chat.assist", { logSuccess: true }), postAssist);

export default router;
