import { prisma } from "../config/prisma.js";

const SOAR_PLAYBOOKS = [
  {
    id: "pb_contain_web_attack",
    name: "Contain Web Attack",
    steps: ["Block source IP", "Create incident", "Notify SOC channel"]
  },
  {
    id: "pb_bruteforce_response",
    name: "Brute Force Response",
    steps: ["Lock targeted account", "Enforce password reset", "Enable temporary geo/IP restriction"]
  }
];

export const listSoarPlaybooks = async () => SOAR_PLAYBOOKS;

export const runSoarPlaybook = async ({ playbookId, alertId, targetIp, tenantId, actorUserId }) => {
  const playbook = SOAR_PLAYBOOKS.find((p) => p.id === playbookId);
  if (!playbook) throw new Error("Playbook not found");

  const alert = alertId
    ? await prisma.alert.findUnique({
        where: { id: alertId },
        include: { threat: { include: { log: true } } }
      })
    : null;

  const resolvedIp = targetIp || alert?.threat?.log?.ipAddress || null;

  const execution = await prisma.soarExecution.create({
    data: {
      playbookId,
      alertId: alertId || null,
      tenantId,
      targetIp: resolvedIp,
      stepsExecuted: playbook.steps,
      status: "COMPLETED"
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: "soar.playbook.run",
      resource: `playbook:${playbookId}`,
      metadata: execution
    }
  });

  return execution;
};

export const listIocs = async (tenantId) => {
  return prisma.ioc.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
};

export const ingestIocs = async ({ tenantId, indicators = [], source = "manual", actorUserId }) => {
  const normalized = (indicators || [])
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return { ingested: 0, items: [] };
  }

  await prisma.ioc.createMany({
    data: normalized.map((value) => ({
      value,
      source,
      tenantId
    }))
  });

  const createdItems = await prisma.ioc.findMany({
    where: {
      tenantId,
      source,
      value: { in: normalized }
    },
    orderBy: { createdAt: "desc" },
    take: normalized.length
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: "threat_intel.ioc.ingest",
      resource: "iocs",
      metadata: { tenantId, count: normalized.length, source }
    }
  });

  return { ingested: normalized.length, items: createdItems };
};

export const matchIocs = async (tenantId) => {
  const iocs = await listIocs(tenantId);
  const values = [...new Set(iocs.map((i) => i.value.toLowerCase()))];
  if (!values.length) return { matches: [], total: 0 };

  const logs = await prisma.log.findMany({
    where: { tenantId },
    select: { id: true, ipAddress: true, path: true, raw: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 400
  });

  const matches = [];
  for (const log of logs) {
    const hay = `${log.ipAddress || ""} ${log.path || ""} ${log.raw || ""}`.toLowerCase();
    const hit = values.find((ioc) => hay.includes(ioc));
    if (hit) {
      matches.push({
        logId: log.id,
        ioc: hit,
        createdAt: log.createdAt,
        ipAddress: log.ipAddress,
        path: log.path
      });
    }
  }

  return { matches, total: matches.length };
};

export const getUebaAnomalies = async (tenantId) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [failedByIp, trafficBySource] = await Promise.all([
    prisma.log.groupBy({
      by: ["ipAddress"],
      where: { tenantId, createdAt: { gte: since }, statusCode: { gte: 401 } },
      _count: { _all: true },
      orderBy: { _count: { ipAddress: "desc" } },
      take: 10
    }),
    prisma.log.groupBy({
      by: ["source"],
      where: { tenantId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 20
    })
  ]);

  const bruteForce = failedByIp
    .filter((x) => (x._count?._all || 0) >= 8)
    .map((x) => ({
      type: "BRUTE_FORCE_PATTERN",
      severity: "HIGH",
      ipAddress: x.ipAddress,
      count: x._count._all,
      message: "High failed-auth activity detected from source IP"
    }));

  const counts = trafficBySource.map((x) => x._count._all || 0);
  const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const spikes = trafficBySource
    .filter((x) => (x._count?._all || 0) > avg * 1.8 && (x._count?._all || 0) > 20)
    .map((x) => ({
      type: "TRAFFIC_SPIKE",
      severity: "MEDIUM",
      source: x.source,
      count: x._count._all,
      message: "Unusual source-level activity spike"
    }));

  return { generatedAt: new Date().toISOString(), anomalies: [...bruteForce, ...spikes] };
};

export const listAssets = async (tenantId) => {
  return prisma.asset.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
};

export const createAsset = async ({ tenantId, hostname, ipAddress, owner, criticality = "MEDIUM", tags = [] }) => {
  return prisma.asset.create({
    data: {
      tenantId,
      hostname,
      ipAddress,
      owner,
      criticality,
      tags
    }
  });
};

export const getComplianceOverview = async (tenantId) => {
  const [openIncidents, criticalThreats24h, unresolvedAlerts, auditEvents24h] = await Promise.all([
    prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, alert: { threat: { log: { tenantId } } } } }),
    prisma.threat.count({
      where: {
        severity: "CRITICAL",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        log: { tenantId }
      }
    }),
    prisma.alert.count({ where: { status: { in: ["NEW", "ACKNOWLEDGED"] }, threat: { log: { tenantId } } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
  ]);

  const controls = [
    {
      control: "Incident Response Timeliness",
      status: openIncidents > 15 ? "AT_RISK" : "PASS",
      evidence: `${openIncidents} open incidents`
    },
    {
      control: "Critical Threat Handling",
      status: criticalThreats24h > 20 ? "AT_RISK" : "PASS",
      evidence: `${criticalThreats24h} critical threats in 24h`
    },
    {
      control: "Alert Queue Hygiene",
      status: unresolvedAlerts > 40 ? "AT_RISK" : "PASS",
      evidence: `${unresolvedAlerts} unresolved alerts`
    },
    {
      control: "Audit Logging Coverage",
      status: auditEvents24h > 0 ? "PASS" : "AT_RISK",
      evidence: `${auditEvents24h} audit events in 24h`
    }
  ];

  return {
    framework: "SOC2/ISO27001 starter pack",
    generatedAt: new Date().toISOString(),
    controls
  };
};

export const listReportSchedules = async (tenantId) => {
  return prisma.reportSchedule.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
};

export const createReportSchedule = async ({ tenantId, name, cadence, recipients = [], query = "" }) => {
  return prisma.reportSchedule.create({
    data: {
      tenantId,
      name,
      cadence,
      recipients,
      query,
      enabled: true
    }
  });
};

export const submitMlFeedback = async ({ tenantId, actorUserId, threatId, expectedLabel, notes }) => {
  return prisma.mlFeedback.create({
    data: {
      tenantId,
      actorUserId,
      threatId,
      expectedLabel,
      notes
    }
  });
};

export const getMlDrift = async (tenantId) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const distribution = await prisma.threat.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since }, log: { tenantId } },
    _count: { _all: true },
    orderBy: { _count: { type: "desc" } }
  });

  const total = distribution.reduce((acc, x) => acc + (x._count?._all || 0), 0);
  const normalized = distribution.map((x) => ({
    type: x.type,
    count: x._count._all,
    ratio: total ? Number((x._count._all / total).toFixed(4)) : 0
  }));

  return {
    generatedAt: new Date().toISOString(),
    window: "7d",
    totalSamples: total,
    classDistribution: normalized,
    driftRisk: total < 30 ? "LOW_CONFIDENCE" : "MONITOR"
  };
};

export const listRuleVersions = async (ruleId) => {
  return prisma.detectionRuleVersion.findMany({
    where: { ruleId },
    orderBy: { version: "asc" }
  });
};

export const addRuleVersion = async ({ ruleId, actorUserId, query, notes, severity }) => {
  const count = await prisma.detectionRuleVersion.count({
    where: { ruleId }
  });
  const nextVersion = count + 1;

  return prisma.detectionRuleVersion.create({
    data: {
      ruleId,
      version: nextVersion,
      actorUserId,
      query,
      notes,
      severity
    }
  });
};
