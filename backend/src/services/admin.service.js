import { prisma } from "../config/prisma.js";
import { getSchedulerStatus, runSchedulerTaskNow } from "./scheduler.service.js";

const normalizeSort = (sortBy, sortOrder, allowed, fallback) => {
  const field = allowed.includes(sortBy) ? sortBy : fallback;
  const order = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
  return { field, order };
};

export const getAdminSummary = async () => {
  const [users, admins, analysts, openIncidents, criticalThreats, unreadAlerts] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "SECURITY_ANALYST" } }),
    prisma.incident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.threat.count({ where: { severity: "CRITICAL" } }),
    prisma.alert.count({ where: { isRead: false } })
  ]);

  return { users, admins, analysts, openIncidents, criticalThreats, unreadAlerts };
};

export const listUsers = async ({
  search = "",
  role = "ALL",
  page = 1,
  pageSize = 10,
  sortBy = "createdAt",
  sortOrder = "desc"
}) => {
  const q = search.trim();
  const where = {
    ...(role !== "ALL" ? { role } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { id: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const skip = (safePage - 1) * safePageSize;
  const sort = normalizeSort(sortBy, sortOrder, ["createdAt", "email", "fullName", "role"], "createdAt");

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        twoFaEnabled: true,
        createdAt: true
      },
      orderBy: { [sort.field]: sort.order },
      skip,
      take: safePageSize
    }),
    prisma.user.count({ where })
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};

export const updateUserRole = async (userId, role) =>
  prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, fullName: true, email: true, role: true, twoFaEnabled: true }
  });

export const listAuditLogs = async ({ search = "", page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" }) => {
  const q = search.trim();
  const where = q
    ? {
        OR: [
          { action: { contains: q, mode: "insensitive" } },
          { resource: { contains: q, mode: "insensitive" } },
          { ipAddress: { contains: q, mode: "insensitive" } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { id: { contains: q, mode: "insensitive" } }
        ]
      }
    : {};

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(200, Math.max(1, Number(pageSize) || 20));
  const skip = (safePage - 1) * safePageSize;
  const sort = normalizeSort(sortBy, sortOrder, ["createdAt", "action", "resource", "ipAddress"], "createdAt");

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, role: true }
        }
      },
      orderBy: { [sort.field]: sort.order },
      skip,
      take: safePageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};

export const exportUsersCsv = async ({ search = "", role = "ALL", sortBy = "createdAt", sortOrder = "desc" }) => {
  const data = await listUsers({ search, role, page: 1, pageSize: 5000, sortBy, sortOrder });
  const header = ["id", "fullName", "email", "role", "twoFaEnabled", "createdAt"];
  const body = data.items.map((u) =>
    [u.id, u.fullName, u.email, u.role, String(u.twoFaEnabled), new Date(u.createdAt).toISOString()]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...body].join("\n");
};

export const exportAuditLogsCsv = async ({ search = "", sortBy = "createdAt", sortOrder = "desc" }) => {
  const data = await listAuditLogs({ search, page: 1, pageSize: 10000, sortBy, sortOrder });
  const header = ["id", "createdAt", "userEmail", "action", "resource", "ipAddress"];
  const body = data.items.map((a) =>
    [a.id, new Date(a.createdAt).toISOString(), a.user?.email || "system", a.action, a.resource, a.ipAddress || ""]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...body].join("\n");
};

export const getAdminSchedulerStatus = () => getSchedulerStatus();

export const runAdminSchedulerTask = (task) => runSchedulerTaskNow(task);