import Joi from "joi";

export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid("ADMIN", "SECURITY_ANALYST").required()
});

export const runSchedulerTaskSchema = Joi.object({
  task: Joi.string().valid("search_jobs", "auto_threat_scan", "alert_escalation", "all").default("all")
});