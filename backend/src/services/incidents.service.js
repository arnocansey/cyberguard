import { prisma } from "../config/prisma.js";
import { generateIncidentPdf } from "../utils/pdf.js";

export const createIncident = async ({ alertId, assignedToId, note }, authorId) => {
  const incident = await prisma.incident.create({
    data: { alertId, assignedToId, notes: note ? { create: { note, authorId } } : undefined },
    include: { alert: { include: { threat: true } }, notes: true }
  });
  return incident;
};

export const updateIncident = async (id, payload, authorId) => {
  const updated = await prisma.incident.update({
    where: { id },
    data: {
      status: payload.status,
      assignedToId: payload.assignedToId,
      resolution: payload.resolution,
      closedAt: payload.status === "CLOSED" ? new Date() : undefined,
      notes: payload.note ? { create: { note: payload.note, authorId } } : undefined
    },
    include: { alert: { include: { threat: true } }, notes: true }
  });

  if (payload.status === "CLOSED") {
    const pdf = await generateIncidentPdf(updated);
    await prisma.report.upsert({
      where: { incidentId: updated.id },
      update: { fileName: pdf.fileName, storagePath: pdf.filePath },
      create: { incidentId: updated.id, fileName: pdf.fileName, storagePath: pdf.filePath }
    });
  }

  return updated;
};

export const listIncidents = () =>
  prisma.incident.findMany({
    include: { alert: { include: { threat: true } }, assignedTo: true, notes: true, report: true },
    orderBy: { createdAt: "desc" }
  });

export const getIncidentTimeline = async (incidentId) => {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      notes: { include: { author: { select: { id: true, email: true, fullName: true } } }, orderBy: { createdAt: "asc" } },
      alert: { include: { threat: true } }
    }
  });

  if (!incident) return null;

  const timeline = [
    {
      ts: incident.createdAt,
      type: "INCIDENT_CREATED",
      detail: `Incident created from alert ${incident.alertId}`
    },
    ...incident.notes.map((n) => ({
      ts: n.createdAt,
      type: "NOTE_ADDED",
      detail: n.note,
      actor: n.author?.email || n.author?.fullName || "unknown"
    }))
  ];

  if (incident.closedAt) {
    timeline.push({
      ts: incident.closedAt,
      type: "INCIDENT_CLOSED",
      detail: incident.resolution || "Incident closed"
    });
  }

  timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return {
    incidentId: incident.id,
    status: incident.status,
    severity: incident.alert?.threat?.severity,
    threatType: incident.alert?.threat?.type,
    timeline
  };
};
