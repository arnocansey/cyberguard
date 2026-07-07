import { prisma } from "../config/prisma.js";

export const listAlerts = async ({ status, severity, assignedToId, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" }) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const safeSortBy = ["createdAt", "severity", "status"].includes(sortBy) ? sortBy : "createdAt";
  const safeSortOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

  const where = {
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(assignedToId ? { assignedToId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: {
        threat: { include: { log: true } },
        assignedTo: { select: { id: true, email: true, fullName: true } },
        incident: { select: { id: true, status: true } }
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize
    }),
    prisma.alert.count({ where })
  ]);

  return { items, total, page: safePage, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil(total / safePageSize)) };
};

export const triageAlert = async (id, payload) =>
  prisma.alert.update({
    where: { id },
    data: {
      status: payload.status,
      assignedToId: payload.assignedToId,
      isRead: payload.isRead,
      acknowledgedAt: payload.status === "ACKNOWLEDGED" ? new Date() : undefined,
      closedAt: payload.status === "CLOSED" ? new Date() : undefined
    }
  });
