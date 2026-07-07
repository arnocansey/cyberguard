import { prisma } from "../config/prisma.js";

const toDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseToken = (token) => {
  const match = token.match(/^([a-zA-Z_]+)(=|!=|>=|<=|>|<)(.+)$/);
  if (!match) return null;
  return { key: match[1], op: match[2], value: match[3] };
};

const numericCondition = (op, value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (op === "=") return { equals: num };
  if (op === "!=") return { not: num };
  if (op === ">") return { gt: num };
  if (op === ">=") return { gte: num };
  if (op === "<") return { lt: num };
  if (op === "<=") return { lte: num };
  return null;
};

const stringCondition = (op, value) => {
  if (op === "=") return { equals: value, mode: "insensitive" };
  if (op === "!=") return { not: { equals: value, mode: "insensitive" } };
  return { contains: value, mode: "insensitive" };
};

const mapSortField = (sortBy) => {
  const allowed = new Set(["createdAt", "source", "sourcetype", "host", "statusCode", "ipAddress"]);
  return allowed.has(sortBy) ? sortBy : "createdAt";
};

const SEARCH_MACROS = {
  auth_failures: "status>=401 path=/login",
  web_attacks: "severity=HIGH",
  suspicious_posts: "method=POST status>=400"
};

const expandMacros = (query = "") => {
  let expanded = String(query || "");
  expanded = expanded.replace(/macro=([a-zA-Z0-9_]+)/g, (_m, macroName) => SEARCH_MACROS[macroName] || "");
  return expanded.trim().replace(/\s+/g, " ");
};

export const buildWhereFromQuery = ({ query, from, to, severity, tenantId }) => {
  const and = [];

  and.push({ tenantId: tenantId || "default" });

  const fromDate = toDateOrNull(from);
  const toDate = toDateOrNull(to);
  if (fromDate || toDate) {
    and.push({
      createdAt: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {})
      }
    });
  }

  if (severity) {
    and.push({ threats: { some: { severity } } });
  }

  const expandedQuery = expandMacros(query);
  const parts = expandedQuery.trim().split(/\s+/).filter(Boolean);
  const freeTextParts = [];

  for (const part of parts) {
    const parsed = parseToken(part);
    if (!parsed) {
      freeTextParts.push(part);
      continue;
    }

    const { key, op, value } = parsed;

    if (["status", "statusCode"].includes(key)) {
      const condition = numericCondition(op, value);
      if (condition) and.push({ statusCode: condition });
      continue;
    }

    if (["source", "sourcetype", "method", "path", "ip", "ipAddress", "host"].includes(key)) {
      const field = key === "ip" ? "ipAddress" : key;
      and.push({ [field]: stringCondition(op, value) });
      continue;
    }

    if (key === "severity") {
      and.push({ threats: { some: { severity: value.toUpperCase() } } });
      continue;
    }

    if (key === "raw") {
      and.push({ raw: stringCondition(op, value) });
      continue;
    }
  }

  for (const token of freeTextParts) {
    and.push({
      OR: [
        { raw: { contains: token, mode: "insensitive" } },
        { path: { contains: token, mode: "insensitive" } },
        { ipAddress: { contains: token, mode: "insensitive" } },
        { source: { contains: token, mode: "insensitive" } },
        { sourcetype: { contains: token, mode: "insensitive" } },
        { host: { contains: token, mode: "insensitive" } }
      ]
    });
  }

  return and.length ? { AND: and } : {};
};

export const searchEvents = async ({
  query = "",
  from,
  to,
  severity,
  page = 1,
  pageSize = 25,
  sortBy = "createdAt",
  sortOrder = "desc",
  tenantId = "default"
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 25));
  const skip = (safePage - 1) * safePageSize;
  const safeSort = mapSortField(sortBy);
  const safeOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

  const where = buildWhereFromQuery({ query, from, to, severity, tenantId });

  const [items, total, sources, sourcetypes, hosts, severities] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        threats: {
          select: { id: true, type: true, severity: true, confidence: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { [safeSort]: safeOrder },
      skip,
      take: safePageSize
    }),
    prisma.log.count({ where }),
    prisma.log.groupBy({ by: ["source"], where, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 8 }),
    prisma.log.groupBy({ by: ["sourcetype"], where, _count: { _all: true }, orderBy: { _count: { sourcetype: "desc" } }, take: 8 }),
    prisma.log.groupBy({ by: ["host"], where, _count: { _all: true }, orderBy: { _count: { host: "desc" } }, take: 8 }),
    prisma.threat.groupBy({ by: ["severity"], where: { log: where }, _count: { _all: true }, orderBy: { _count: { severity: "desc" } }, take: 8 })
  ]);

  return {
    items,
    facets: {
      sources,
      sourcetypes,
      hosts,
      severities
    },
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};

export const exportEventsCsv = async ({ query = "", from, to, severity, sortBy = "createdAt", sortOrder = "desc", tenantId = "default" }) => {
  const safeSort = mapSortField(sortBy);
  const safeOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
  const where = buildWhereFromQuery({ query, from, to, severity, tenantId });

  const rows = await prisma.log.findMany({
    where,
    include: {
      threats: {
        select: { type: true, severity: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { [safeSort]: safeOrder },
    take: 5000
  });

  const header = ["timestamp", "host", "source", "sourcetype", "statusCode", "ipAddress", "severity", "threatType", "raw"];
  const body = rows.map((r) => {
    const t = r.threats?.[0];
    const values = [
      r.createdAt.toISOString(),
      r.host || "",
      r.source || "",
      r.sourcetype || "",
      String(r.statusCode ?? ""),
      r.ipAddress || "",
      t?.severity || "",
      t?.type || "",
      r.raw || ""
    ];
    return values
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [header.join(","), ...body].join("\n");
};

export const queryPanelMetrics = async ({ query = "", from, to, tenantId = "default" }) => {
  const where = buildWhereFromQuery({ query, from, to, tenantId });
  const [total, bySource, bySeverity] = await Promise.all([
    prisma.log.count({ where }),
    prisma.log.groupBy({ by: ["source"], where, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 12 }),
    prisma.threat.groupBy({ by: ["severity"], where: { log: where }, _count: { _all: true }, orderBy: { _count: { severity: "desc" } }, take: 8 })
  ]);

  return { total, bySource, bySeverity };
};
