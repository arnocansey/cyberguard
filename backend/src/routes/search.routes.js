import { Router } from "express";
import {
  deleteSavedSearchController,
  getAlertRulesController,
  getEvents,
  getEventsCsv,
  getSavedSearches,
  getSearchJobs,
  patchSearchJob,
  postAlertRuleController,
  postBulkIncidentController,
  postSavedSearch,
  postSearchJob,
  runSavedSearchController
} from "../controllers/search.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { auditLogger } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/events", authenticate, auditLogger("search.events"), getEvents);
router.get("/events/export", authenticate, auditLogger("search.events.export"), getEventsCsv);

router.get("/saved-searches", authenticate, auditLogger("search.saved.list"), getSavedSearches);
router.post("/saved-searches", authenticate, auditLogger("search.saved.create", { logSuccess: true }), postSavedSearch);
router.get("/saved-searches/:id/run", authenticate, auditLogger("search.saved.run", { logSuccess: true }), runSavedSearchController);
router.delete("/saved-searches/:id", authenticate, auditLogger("search.saved.delete", { logSuccess: true }), deleteSavedSearchController);

router.get("/jobs", authenticate, auditLogger("search.jobs.list"), getSearchJobs);
router.post("/jobs", authenticate, auditLogger("search.jobs.create", { logSuccess: true }), postSearchJob);
router.patch("/jobs/:id", authenticate, auditLogger("search.jobs.update", { logSuccess: true }), patchSearchJob);

router.get("/alert-rules", authenticate, auditLogger("search.rules.list"), getAlertRulesController);
router.post("/alert-rules", authenticate, auditLogger("search.rules.create", { logSuccess: true }), postAlertRuleController);

router.post("/incidents/bulk", authenticate, auditLogger("search.bulk.incident", { logSuccess: true }), postBulkIncidentController);

export default router;
