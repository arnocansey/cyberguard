import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { hashApiKey } from "../middleware/apikey.middleware.js";

export const generateApiKey = async ({ name, tenantId, expiresDays }) => {
  const rawKey = "cg_ingest_" + crypto.randomBytes(16).toString("hex");
  const keyHash = hashApiKey(rawKey);

  let expiresAt = null;
  if (expiresDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresDays, 10));
  }

  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      tenantId,
      expiresAt
    }
  });

  return {
    id: apiKeyRecord.id,
    name: apiKeyRecord.name,
    tenantId: apiKeyRecord.tenantId,
    rawKey,
    expiresAt: apiKeyRecord.expiresAt,
    createdAt: apiKeyRecord.createdAt
  };
};

export const listApiKeys = async (tenantId) => {
  const keys = await prisma.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return keys.map(k => ({
    id: k.id,
    name: k.name,
    isActive: k.isActive,
    expiresAt: k.expiresAt,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt
  }));
};

export const revokeApiKey = async (id, tenantId) => {
  return prisma.apiKey.deleteMany({
    where: { id, tenantId }
  });
};
