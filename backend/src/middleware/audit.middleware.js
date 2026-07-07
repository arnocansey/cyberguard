import { prisma } from "../config/prisma.js";

export const auditLogger = (resource, options = {}) => async (req, res, next) => {
  const startedAt = Date.now();
  const shouldLogSuccess = options.logSuccess === true;

  res.on("finish", async () => {
    const shouldLog = shouldLogSuccess ? res.statusCode < 500 : res.statusCode >= 400;
    if (!shouldLog) return;

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.sub || null,
          action: req.method,
          resource,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: {
            requestId: req.requestId,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            path: req.originalUrl
          }
        }
      });
    } catch {
      // avoid crashing request lifecycle on audit failure
    }
  });

  next();
};
