import { prisma } from "../config/prisma.js";

export const createIntegration = async ({ name, type, targetUrl, secretKey, tenantId }) => {
  return prisma.integration.create({
    data: {
      name,
      type: type || "WEBHOOK",
      targetUrl,
      secretKey,
      tenantId
    }
  });
};

export const listIntegrations = async (tenantId) => {
  const integrations = await prisma.integration.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return integrations.map(i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    targetUrl: i.targetUrl,
    isActive: i.isActive,
    createdAt: i.createdAt
  }));
};

export const deleteIntegration = async (id, tenantId) => {
  return prisma.integration.deleteMany({
    where: { id, tenantId }
  });
};
