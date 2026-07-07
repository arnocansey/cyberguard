import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/prisma.js";

export const hashApiKey = (key) => {
  return crypto.createHash("sha256").update(key).digest("hex");
};

export const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Missing API Key",
      requestId: req.requestId
    });
  }

  try {
    const keyHash = hashApiKey(apiKey);
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash }
    });

    if (!keyRecord || !keyRecord.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid or inactive API Key",
        requestId: req.requestId
      });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "API Key has expired",
        requestId: req.requestId
      });
    }

    // Attach tenantId and apiKeyId to request context
    req.tenantId = keyRecord.tenantId;
    req.apiKeyId = keyRecord.id;

    // Asynchronously update lastUsedAt to log usage
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(err => console.error("Failed to update API key lastUsedAt:", err));

    return next();
  } catch (error) {
    return next(error);
  }
};
