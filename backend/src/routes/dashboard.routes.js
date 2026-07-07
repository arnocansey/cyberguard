import { Router } from "express";
import {
  getLayoutsController,
  getPanelDataController,
  getPanels,
  patchPanel,
  postApplyLayoutController,
  postLayoutController,
  postPanel,
  postPanelReorder
} from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/panels", authenticate, auditLogger("dashboard.panels.list"), getPanels);
router.post("/panels", authenticate, auditLogger("dashboard.panels.create", { logSuccess: true }), postPanel);
router.patch("/panels/:id", authenticate, auditLogger("dashboard.panels.update", { logSuccess: true }), patchPanel);
router.post("/panels/reorder", authenticate, auditLogger("dashboard.panels.reorder", { logSuccess: true }), postPanelReorder);
router.get("/panels/:id/data", authenticate, auditLogger("dashboard.panels.data"), getPanelDataController);

router.get("/layouts", authenticate, auditLogger("dashboard.layouts.list"), getLayoutsController);
router.post("/layouts", authenticate, auditLogger("dashboard.layouts.create", { logSuccess: true }), postLayoutController);
router.post("/layouts/:id/apply", authenticate, auditLogger("dashboard.layouts.apply", { logSuccess: true }), postApplyLayoutController);

export default router;
