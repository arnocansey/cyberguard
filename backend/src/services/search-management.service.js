import { prisma } from "../config/prisma.js";
import { searchEvents } from "./search.service.js";

export const listSavedSearches = (userId) =>
  prisma.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

export const createSavedSearch = (userId, payload) =>
  prisma.savedSearch.create({
    data: {
      userId,
      name: payload.name,
      query: payload.query,
      timeRange: payload.timeRange || "24h"
    }
  });

export const runSavedSearch = async (userId, id, opts = {}) => {
  const saved = await prisma.savedSearch.findFirst({ where: { id, userId } });
  if (!saved) throw Object.assign(new Error("Saved search not found"), { status: 404 });
  return searchEvents({ query: saved.query, from: opts.from, to: opts.to, page: opts.page, pageSize: opts.pageSize, tenantId: opts.tenantId || "default" });
};

export const deleteSavedSearch = async (userId, id) => {
  await prisma.savedSearch.deleteMany({ where: { id, userId } });
  return { message: "Deleted" };
};

export const listSearchJobs = (userId) =>
  prisma.searchJob.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

export const createSearchJob = (userId, payload) =>
  prisma.searchJob.create({
    data: {
      userId,
      name: payload.name,
      query: payload.query,
      schedule: payload.schedule,
      resultThreshold: payload.resultThreshold || 1,
      enabled: payload.enabled ?? true
    }
  });

export const updateSearchJob = async (userId, id, payload) => {
  const existing = await prisma.searchJob.findFirst({ where: { id, userId } });
  if (!existing) throw Object.assign(new Error("Search job not found"), { status: 404 });
  return prisma.searchJob.update({
    where: { id },
    data: {
      name: payload.name,
      query: payload.query,
      schedule: payload.schedule,
      resultThreshold: payload.resultThreshold,
      enabled: payload.enabled
    }
  });
};

export const listAlertRules = (userId) =>
  prisma.alertRule.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

export const createAlertRule = (userId, payload) =>
  prisma.alertRule.create({
    data: {
      userId,
      name: payload.name,
      query: payload.query,
      resultThreshold: payload.resultThreshold || 1,
      enabled: payload.enabled ?? true
    }
  });

export const bulkCreateIncidentsFromLogs = async ({ logIds, assignedToId, actorUserId }) => {
  const created = [];

  for (const logId of logIds) {
    const log = await prisma.log.findUnique({ where: { id: logId }, include: { threats: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!log) continue;

    let threat = log.threats[0];
    if (!threat) {
      threat = await prisma.threat.create({
        data: {
          logId,
          type: "ANOMALY",
          confidence: 0.55,
          severity: "MEDIUM"
        }
      });
    }

    const alert = await prisma.alert.create({
      data: {
        threatId: threat.id,
        message: `Manual triage: ${threat.type} on log ${log.id}`,
        severity: threat.severity
      }
    });

    const incident = await prisma.incident.create({
      data: {
        alertId: alert.id,
        assignedToId: assignedToId || actorUserId,
        notes: {
          create: {
            authorId: actorUserId,
            note: "Created from Events Explorer bulk action"
          }
        }
      }
    });

    created.push(incident);
  }

  return { count: created.length, incidents: created };
};

