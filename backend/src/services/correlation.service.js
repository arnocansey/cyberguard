import { searchEvents } from "./search.service.js";
import { prisma } from "../config/prisma.js";

export const listCorrelationRules = () => prisma.correlationRule.findMany({ orderBy: { createdAt: "desc" } });

export const createCorrelationRule = (payload) =>
  prisma.correlationRule.create({
    data: {
      name: payload.name,
      description: payload.description,
      query: payload.query,
      severity: payload.severity || "MEDIUM",
      enabled: payload.enabled ?? true
    }
  });

export const updateCorrelationRule = (id, payload) =>
  prisma.correlationRule.update({
    where: { id },
    data: {
      name: payload.name,
      description: payload.description,
      query: payload.query,
      severity: payload.severity,
      enabled: payload.enabled
    }
  });

export const deleteCorrelationRule = async (id) => {
  await prisma.correlationRule.delete({ where: { id } });
  return { message: "Deleted" };
};

export const simulateCorrelationRule = async (id, from, to) => {
  const rule = await prisma.correlationRule.findUnique({ where: { id } });
  if (!rule) throw Object.assign(new Error("Rule not found"), { status: 404 });
  const result = await searchEvents({ query: rule.query, from, to, page: 1, pageSize: 5 });
  return {
    rule,
    matchedCount: result.total,
    sample: result.items
  };
};
