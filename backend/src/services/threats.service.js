import { prisma } from "../config/prisma.js";
import { getMitreForThreat } from "../utils/mitre-map.js";

export const getThreats = async (tenantId = "default") => {
  const threats = await prisma.threat.findMany({
    where: { log: { tenantId } },
    include: {
      log: true,
      alerts: {
        include: { incident: { select: { id: true, status: true } } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return threats.map((t) => ({ ...t, mitre: getMitreForThreat(t.type) }));
};

export const getThreatStats = async (tenantId = "default") => {
  const [totalLogs, totalThreats, grouped, topIps] = await Promise.all([
    prisma.log.count({ where: { tenantId } }),
    prisma.threat.count({ where: { log: { tenantId } } }),
    prisma.threat.groupBy({ by: ["type"], where: { log: { tenantId } }, _count: { _all: true } }),
    prisma.log.groupBy({
      by: ["ipAddress"],
      where: { tenantId },
      _count: { _all: true },
      orderBy: { _count: { ipAddress: "desc" } },
      take: 10
    })
  ]);

  return {
    totalLogs,
    totalThreats,
    threatCategories: grouped.map((g) => ({ ...g, mitre: getMitreForThreat(g.type) })),
    topAttackerIps: topIps,
    riskScore: totalLogs ? Number(((totalThreats / totalLogs) * 100).toFixed(2)) : 0
  };
};
