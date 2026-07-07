import axios from "axios";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { recordAiRetry, recordAiTimeout } from "../config/metrics.js";
import { parseLine } from "../utils/log-parser.js";

const severityByType = {
  SQL_INJECTION: "CRITICAL",
  XSS: "HIGH",
  BRUTE_FORCE: "MEDIUM",
  DDOS: "CRITICAL",
  ANOMALY: "MEDIUM",
  BENIGN: "LOW"
};

const callAiService = async (logs) => {
  const request = () =>
    axios.post(
      `${env.aiServiceUrl}/predict`,
      { logs },
      {
        timeout: env.aiServiceTimeoutMs,
        headers: {
          ...(env.aiServiceApiKey ? { "x-ai-api-key": env.aiServiceApiKey } : {})
        }
      }
    );

  try {
    return await request();
  } catch (error) {
    const code = error?.code || "";
    const status = error?.response?.status;
    const retriable = code === "ECONNABORTED" || code === "ECONNRESET" || code === "ENOTFOUND" || status >= 500;

    if (code === "ECONNABORTED") recordAiTimeout();
    if (!retriable) throw error;

    recordAiRetry();
    return request();
  }
};

const normalizeParsedJson = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const buildAiPayload = (logs) =>
  logs.map((log) => ({
    id: log.id,
    ...normalizeParsedJson(log.parsedJson),
    source: log.source,
    sourcetype: log.sourcetype,
    host: log.host,
    raw: log.raw,
    ipAddress: log.ipAddress,
    method: log.method,
    path: log.path,
    statusCode: log.statusCode
  }));

const createThreatArtifacts = async ({ predictions = [], modelVersion, context = "upload" }) => {
  const createdThreats = [];

  for (const pred of predictions) {
    if (!pred?.logId || !pred?.label) continue;

    const existingThreat = await prisma.threat.findFirst({ where: { logId: pred.logId } });
    if (existingThreat) continue;

    const type = String(pred.label).toUpperCase();
    const severity = severityByType[type] || "LOW";

    const threat = await prisma.threat.create({
      data: {
        logId: pred.logId,
        type,
        confidence: Number(pred.confidence || 0),
        severity
      }
    });

    const messagePrefix = context === "scheduled_scan" ? `${type} detected during scheduled scan` : `${type} detected`;

    const alert = await prisma.alert.create({
      data: {
        threatId: threat.id,
        message: `${messagePrefix} on log ${pred.logId}`,
        severity
      },
      include: { threat: true }
    });

    createdThreats.push({
      threat,
      alert,
      ai: {
        modelVersion: pred.modelVersion || modelVersion || null,
        explanation: pred.explanation || null,
        guidance: pred.guidance || null
      }
    });
  }

  return createdThreats;
};

export const processUploadedLogs = async (rawFile, source = "apache", tenantId = "default") => {
  const lines = rawFile.split(/\r?\n/).filter(Boolean);
  const createdLogs = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    const log = await prisma.log.create({
      data: {
        source,
        sourcetype: source,
        host: parsed.host || parsed.ipAddress || null,
        raw: line,
        parsedJson: parsed,
        ipAddress: parsed.ipAddress,
        method: parsed.method,
        path: parsed.path,
        statusCode: parsed.statusCode,
        tenantId
      }
    });
    createdLogs.push(log);
  }

  if (!createdLogs.length) return { processed: 0, threats: [] };

  const { data } = await callAiService(buildAiPayload(createdLogs));
  const createdThreats = await createThreatArtifacts({
    predictions: data?.predictions || [],
    modelVersion: data?.modelVersion,
    context: "upload"
  });

  return { processed: createdLogs.length, threats: createdThreats };
};

export const scanUnclassifiedLogs = async ({ tenantId, batchSize = 200 } = {}) => {
  const where = {
    threats: { none: {} },
    ...(tenantId ? { tenantId } : {})
  };

  const logs = await prisma.log.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Number(batchSize) || 200)
  });

  if (!logs.length) {
    return {
      scannedCount: 0,
      detectionsCount: 0,
      alertsCount: 0,
      modelVersion: null,
      createdThreats: []
    };
  }

  const { data } = await callAiService(buildAiPayload(logs));
  const createdThreats = await createThreatArtifacts({
    predictions: data?.predictions || [],
    modelVersion: data?.modelVersion,
    context: "scheduled_scan"
  });

  return {
    scannedCount: logs.length,
    detectionsCount: createdThreats.length,
    alertsCount: createdThreats.length,
    modelVersion: data?.modelVersion || null,
    createdThreats
  };
};

export const getLogs = (tenantId = "default") =>
  prisma.log.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 200 });

export const getLogById = (id, tenantId = "default") =>
  prisma.log.findFirst({ where: { id, tenantId } });

export const clearAllLogs = (tenantId = "default") => prisma.log.deleteMany({ where: { tenantId } });

export const processIngestedLogs = async (logsArray, source = "external_api", tenantId = "default") => {
  const createdLogs = [];

  for (const item of logsArray) {
    if (!item || typeof item !== "object") continue;
    const raw = item.raw || `[JSON] ${item.method || "GET"} ${item.path || "/"} ${item.statusCode || 200}`;
    const log = await prisma.log.create({
      data: {
        source,
        sourcetype: source,
        host: item.host || item.ipAddress || null,
        raw,
        parsedJson: item,
        ipAddress: item.ipAddress || null,
        method: item.method || null,
        path: item.path || null,
        statusCode: item.statusCode ? parseInt(item.statusCode, 10) : null,
        tenantId
      }
    });
    createdLogs.push(log);
  }

  if (!createdLogs.length) return { processed: 0, threats: [] };

  const { data } = await callAiService(buildAiPayload(createdLogs));
  const createdThreats = await createThreatArtifacts({
    predictions: data?.predictions || [],
    modelVersion: data?.modelVersion,
    context: "ingest"
  });

  return { processed: createdLogs.length, threats: createdThreats };
};