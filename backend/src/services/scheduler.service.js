import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { prisma } from "../config/prisma.js";
import { scanUnclassifiedLogs } from "./logs.service.js";
import { searchEvents } from "./search.service.js";

const intervalMs = {
  EVERY_5M: 5 * 60 * 1000,
  EVERY_1H: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000
};

const VALID_TASK_KEYS = ["search_jobs", "auto_threat_scan", "alert_escalation", "all"];

const runtime = {
  startedAt: null,
  timer: null,
  io: null,
  tasks: {
    search_jobs: {
      key: "search_jobs",
      label: "Scheduled Search Jobs",
      cron: env.searchJobCron,
      enabled: true,
      running: false,
      lastRunAt: null,
      lastDurationMs: null,
      lastResult: null,
      lastError: null,
      runCount: 0,
      successCount: 0,
      failureCount: 0
    },
    auto_threat_scan: {
      key: "auto_threat_scan",
      label: "Auto Threat Scan",
      cron: env.autoThreatScanCron,
      enabled: env.autoThreatScanEnabled,
      running: false,
      lastRunAt: null,
      lastDurationMs: null,
      lastResult: null,
      lastError: null,
      runCount: 0,
      successCount: 0,
      failureCount: 0
    },
    alert_escalation: {
      key: "alert_escalation",
      label: "Alert Escalation",
      cron: env.alertEscalationCron,
      enabled: env.alertEscalationEnabled,
      running: false,
      lastRunAt: null,
      lastDurationMs: null,
      lastResult: null,
      lastError: null,
      runCount: 0,
      successCount: 0,
      failureCount: 0
    }
  }
};

const normalizeCron = (expr, fallback = "* * * * *") => {
  const str = String(expr || fallback).trim();
  const parts = str.split(/\s+/);
  return parts.length === 5 ? str : fallback;
};

const matchField = (field, value, min, max) => {
  const token = String(field || "*").trim();
  if (token === "*") return true;

  const fragments = token.split(",").map((f) => f.trim()).filter(Boolean);
  if (!fragments.length) return false;

  for (const frag of fragments) {
    if (frag === "*") return true;

    if (frag.startsWith("*/")) {
      const step = Number(frag.slice(2));
      if (Number.isFinite(step) && step > 0 && value % step === 0) return true;
      continue;
    }

    if (frag.includes("-")) {
      const [startRaw, endRaw] = frag.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (Number.isFinite(start) && Number.isFinite(end) && start >= min && end <= max && value >= start && value <= end) return true;
      continue;
    }

    const numeric = Number(frag);
    if (Number.isFinite(numeric) && numeric === value) return true;
  }

  return false;
};

const matchesCronNow = (expr, now = new Date()) => {
  const [m, h, dom, mon, dow] = normalizeCron(expr).split(/\s+/);
  return (
    matchField(m, now.getMinutes(), 0, 59) &&
    matchField(h, now.getHours(), 0, 23) &&
    matchField(dom, now.getDate(), 1, 31) &&
    matchField(mon, now.getMonth() + 1, 1, 12) &&
    matchField(dow, now.getDay(), 0, 6)
  );
};

const hasRunThisMinute = (lastRunAt, now = new Date()) => {
  if (!lastRunAt) return false;
  const prev = new Date(lastRunAt);
  return (
    prev.getFullYear() === now.getFullYear() &&
    prev.getMonth() === now.getMonth() &&
    prev.getDate() === now.getDate() &&
    prev.getHours() === now.getHours() &&
    prev.getMinutes() === now.getMinutes()
  );
};

const shouldRunSearchJob = (job, now) => {
  const ms = intervalMs[job.schedule] || intervalMs.EVERY_1H;
  if (!job.lastRunAt) return true;
  return now.getTime() - new Date(job.lastRunAt).getTime() >= ms;
};

const createAlertForJob = async (job, total) => {
  const log = await prisma.log.create({
    data: {
      source: "search_job",
      sourcetype: "scheduled_search",
      host: "scheduler",
      raw: `[Scheduled Job] ${job.name} threshold hit: ${total} results`,
      parsedJson: { jobId: job.id, name: job.name, total },
      method: "SEARCH",
      path: `/scheduled/${job.id}`,
      statusCode: 200,
      tenantId: env.defaultTenantId
    }
  });

  const threat = await prisma.threat.create({
    data: {
      logId: log.id,
      type: "ANOMALY",
      confidence: 0.9,
      severity: "HIGH"
    }
  });

  const alert = await prisma.alert.create({
    data: {
      threatId: threat.id,
      message: `Scheduled search '${job.name}' exceeded threshold (${total} >= ${job.resultThreshold})`,
      severity: "HIGH"
    }
  });

  return alert;
};

export const runDueSearchJobs = async () => {
  const now = new Date();
  const jobs = await prisma.searchJob.findMany({ where: { enabled: true } });

  let checkedJobs = jobs.length;
  let executedJobs = 0;
  let alertsCreated = 0;
  let failedJobs = 0;

  for (const job of jobs) {
    if (!shouldRunSearchJob(job, now)) continue;

    try {
      const windowMs = intervalMs[job.schedule] || intervalMs.EVERY_1H;
      const from = new Date(now.getTime() - windowMs).toISOString();
      const result = await searchEvents({ query: job.query, from, to: now.toISOString(), page: 1, pageSize: 1, tenantId: env.defaultTenantId });

      if (result.total >= job.resultThreshold) {
        const alert = await createAlertForJob(job, result.total);
        alertsCreated += 1;

        if (runtime.io) {
          runtime.io.emit("threat-alert", {
            alertId: alert.id,
            severity: alert.severity,
            type: "SCHEDULED_SEARCH",
            confidence: 0.9
          });
        }
      }

      executedJobs += 1;
      await prisma.searchJob.update({ where: { id: job.id }, data: { lastRunAt: now } });
    } catch (error) {
      failedJobs += 1;
      logger.error({ jobId: job.id, error: error.message }, "Scheduled search job failed");
    }
  }

  return { checkedJobs, executedJobs, alertsCreated, failedJobs };
};

export const runAutoThreatScan = async () => {
  const result = await scanUnclassifiedLogs({ batchSize: env.autoThreatScanBatchSize });

  if (runtime.io && result?.createdThreats?.length) {
    for (const item of result.createdThreats) {
      runtime.io.emit("threat-alert", {
        alertId: item.alert.id,
        severity: item.alert.severity,
        type: item.threat.type,
        confidence: item.threat.confidence
      });
    }
  }

  return {
    scannedCount: result.scannedCount,
    detectionsCount: result.detectionsCount,
    alertsCount: result.alertsCount,
    modelVersion: result.modelVersion
  };
};

export const runAlertEscalation = async () => {
  const cutoff = new Date(Date.now() - env.alertEscalationMinutes * 60 * 1000);

  const candidates = await prisma.alert.findMany({
    where: {
      status: "NEW",
      severity: { in: env.alertEscalationSeverities },
      createdAt: { lte: cutoff }
    },
    orderBy: { createdAt: "asc" },
    take: env.alertEscalationMaxPerRun
  });

  let escalated = 0;
  let skipped = 0;

  for (const alert of candidates) {
    const alreadyEscalatedMessage = String(alert.message || "").startsWith("[ESCALATED");
    const targetSeverity = alert.severity === env.alertEscalationTargetSeverity ? alert.severity : env.alertEscalationTargetSeverity;

    if (alreadyEscalatedMessage && alert.severity === targetSeverity) {
      skipped += 1;
      continue;
    }

    const message = alreadyEscalatedMessage ? alert.message : `[ESCALATED +${env.alertEscalationMinutes}m] ${alert.message}`;

    const updated = await prisma.alert.update({
      where: { id: alert.id },
      data: {
        severity: targetSeverity,
        message,
        isRead: false
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "alert.escalated",
        resource: "Alert",
        metadata: {
          alertId: alert.id,
          fromSeverity: alert.severity,
          toSeverity: targetSeverity,
          thresholdMinutes: env.alertEscalationMinutes
        }
      }
    });

    if (runtime.io) {
      runtime.io.emit("threat-alert", {
        alertId: updated.id,
        severity: updated.severity,
        type: "ALERT_ESCALATED",
        confidence: 1
      });
    }

    escalated += 1;
  }

  return {
    scannedAlerts: candidates.length,
    escalated,
    skipped,
    thresholdMinutes: env.alertEscalationMinutes,
    targetSeverity: env.alertEscalationTargetSeverity
  };
};

const executeTask = async (taskKey, handler) => {
  const task = runtime.tasks[taskKey];
  if (!task || task.running) {
    return {
      skipped: true,
      reason: !task ? "Unknown task" : "Task already running"
    };
  }

  task.running = true;
  task.lastError = null;
  task.runCount += 1;
  const startedAt = Date.now();

  try {
    const result = await handler();
    task.lastRunAt = new Date().toISOString();
    task.lastDurationMs = Date.now() - startedAt;
    task.lastResult = result;
    task.successCount += 1;
    return { ok: true, result };
  } catch (error) {
    task.lastRunAt = new Date().toISOString();
    task.lastDurationMs = Date.now() - startedAt;
    task.lastError = error.message;
    task.failureCount += 1;
    logger.error({ task: taskKey, error: error.message }, "Scheduler task failed");
    return { ok: false, error: error.message };
  } finally {
    task.running = false;
  }
};

const runTaskIfDue = async (taskKey, now, handler) => {
  const task = runtime.tasks[taskKey];
  if (!task || !task.enabled) return;
  if (!matchesCronNow(task.cron, now)) return;
  if (hasRunThisMinute(task.lastRunAt, now)) return;
  await executeTask(taskKey, handler);
};

const schedulerTick = async () => {
  const now = new Date();

  await runTaskIfDue("search_jobs", now, runDueSearchJobs);
  await runTaskIfDue("auto_threat_scan", now, runAutoThreatScan);
  await runTaskIfDue("alert_escalation", now, runAlertEscalation);
};

export const getSchedulerStatus = () => ({
  enabled: env.schedulerEnabled,
  tickSeconds: env.schedulerTickSeconds,
  startedAt: runtime.startedAt,
  now: new Date().toISOString(),
  config: {
    searchJobCron: env.searchJobCron,
    autoThreatScanEnabled: env.autoThreatScanEnabled,
    autoThreatScanCron: env.autoThreatScanCron,
    autoThreatScanBatchSize: env.autoThreatScanBatchSize,
    alertEscalationEnabled: env.alertEscalationEnabled,
    alertEscalationCron: env.alertEscalationCron,
    alertEscalationMinutes: env.alertEscalationMinutes,
    alertEscalationSeverities: env.alertEscalationSeverities,
    alertEscalationTargetSeverity: env.alertEscalationTargetSeverity,
    alertEscalationMaxPerRun: env.alertEscalationMaxPerRun
  },
  tasks: Object.values(runtime.tasks).map((task) => ({ ...task }))
});

export const runSchedulerTaskNow = async (task = "all") => {
  const normalized = String(task || "all").toLowerCase();
  if (!VALID_TASK_KEYS.includes(normalized)) {
    throw Object.assign(new Error("Invalid scheduler task"), { status: 400 });
  }

  if (normalized === "all") {
    const [searchJobs, autoThreatScan, alertEscalation] = await Promise.all([
      executeTask("search_jobs", runDueSearchJobs),
      executeTask("auto_threat_scan", runAutoThreatScan),
      executeTask("alert_escalation", runAlertEscalation)
    ]);

    return { task: "all", results: { searchJobs, autoThreatScan, alertEscalation } };
  }

  if (normalized === "search_jobs") return { task: normalized, ...(await executeTask("search_jobs", runDueSearchJobs)) };
  if (normalized === "auto_threat_scan") return { task: normalized, ...(await executeTask("auto_threat_scan", runAutoThreatScan)) };
  return { task: normalized, ...(await executeTask("alert_escalation", runAlertEscalation)) };
};

export const startScheduler = (io) => {
  runtime.io = io || null;

  if (!env.schedulerEnabled) {
    logger.warn("Scheduler disabled via SCHEDULER_ENABLED=false");
    return () => {};
  }

  runtime.startedAt = new Date().toISOString();

  runtime.timer = setInterval(() => {
    schedulerTick().catch((error) => {
      logger.error({ error: error.message }, "Scheduler tick failed");
    });
  }, env.schedulerTickSeconds * 1000);

  logger.info({ tickSeconds: env.schedulerTickSeconds }, "Scheduler started");

  return () => {
    if (runtime.timer) clearInterval(runtime.timer);
    runtime.timer = null;
  };
};