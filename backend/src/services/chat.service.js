import axios from "axios";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { recordAiRetry, recordAiTimeout } from "../config/metrics.js";

const buildContextSnapshot = async (tenantId = "default") => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [logs, threats, openIncidents, newAlerts, topThreats24h] = await Promise.all([
    prisma.log.count({ where: { tenantId } }),
    prisma.threat.count({ where: { log: { tenantId } } }),
    prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, alert: { threat: { log: { tenantId } } } } }),
    prisma.alert.count({ where: { status: "NEW", threat: { log: { tenantId } } } }),
    prisma.threat.groupBy({
      by: ["type"],
      where: { createdAt: { gte: last24h }, log: { tenantId } },
      _count: { _all: true },
      orderBy: { _count: { type: "desc" } },
      take: 5
    })
  ]);

  return {
    counts: {
      logs,
      threats,
      openIncidents,
      newAlerts
    },
    topThreats24h: topThreats24h.map((item) => ({ type: item.type, count: item._count._all }))
  };
};

const callAiChat = async (payload) => {
  const request = () =>
    axios.post(`${env.aiServiceUrl}/chat`, payload, {
      timeout: env.aiServiceTimeoutMs,
      headers: {
        ...(env.aiServiceApiKey ? { "x-ai-api-key": env.aiServiceApiKey } : {})
      }
    });

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

const fallbackReply = (context) => {
  const c = context?.counts || {};
  const top = (context?.topThreats24h || []).slice(0, 3).map((t) => `${t.type} (${t.count})`).join(", ");

  const lines = [
    "SOC Copilot fallback response:",
    `- Logs: ${c.logs || 0} | Threats: ${c.threats || 0} | Open incidents: ${c.openIncidents || 0} | New alerts: ${c.newAlerts || 0}`,
    top ? `- Top threats (24h): ${top}` : "- No threat activity in the last 24h.",
    "- Suggested next step: review NEW alerts, acknowledge high-severity ones, and convert critical alerts to incidents."
  ];

  return {
    intent: "general_soc_help",
    guidanceLabel: context?.topThreats24h?.[0]?.type || null,
    reply: lines.join("\n"),
    suggestedPrompts: [
      "Show me treatment steps for the top threat.",
      "Give me incident triage checklist.",
      "What should I investigate first today?"
    ],
    degraded: true
  };
};

export const chatAssist = async ({ userId, message, history = [], tenantId = "default" }) => {
  const context = await buildContextSnapshot(tenantId);
  const payload = {
    message,
    history: (history || []).slice(-8).map((h) => ({ role: h.role, content: h.content })),
    context,
    user: { id: userId, tenantId }
  };

  try {
    const { data } = await callAiChat(payload);
    return {
      ...data,
      context,
      degraded: false
    };
  } catch {
    return {
      modelVersion: "fallback-local",
      ...fallbackReply(context),
      context
    };
  }
};
