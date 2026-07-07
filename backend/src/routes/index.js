import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import alertsRoutes from "./alerts.routes.js";
import authRoutes from "./auth.routes.js";
import chatRoutes from "./chat.routes.js";
import correlationRoutes from "./correlation.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import enterpriseRoutes from "./enterprise.routes.js";
import incidentsRoutes from "./incidents.routes.js";
import logsRoutes from "./logs.routes.js";
import reportsRoutes from "./reports.routes.js";
import searchRoutes from "./search.routes.js";
import threatsRoutes from "./threats.routes.js";
import apikeyRoutes from "./apikey.routes.js";
import ingestRoutes from "./ingest.routes.js";
import integrationRoutes from "./integration.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/logs", logsRoutes);
router.use("/logs/ingest", ingestRoutes);
router.use("/threats", threatsRoutes);
router.use("/alerts", alertsRoutes);
router.use("/incidents", incidentsRoutes);
router.use("/reports", reportsRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/apikeys", apikeyRoutes);
router.use("/admin/integrations", integrationRoutes);
router.use("/search", searchRoutes);
router.use("/correlation-rules", correlationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/chat", chatRoutes);
router.use("/enterprise", enterpriseRoutes);

export default router;
