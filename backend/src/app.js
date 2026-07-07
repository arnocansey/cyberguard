import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import xssClean from "xss-clean";
import axios from "axios";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./config/prisma.js";
import { logger } from "./config/logger.js";
import { getMetricsSnapshot, recordRequest } from "./config/metrics.js";
import apiRoutes from "./routes/index.js";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { attachRequestContext } from "./middleware/request-context.middleware.js";
import { attachTenantContext } from "./middleware/tenant.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const buildLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
  });

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (env.corsAllowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true
};

const checkDependencies = async () => {
  const startedAt = Date.now();
  const metrics = getMetricsSnapshot();

  const [db, ai] = await Promise.all([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => ({ status: "up" }))
      .catch((e) => ({ status: "down", error: e.message })),
    axios
      .get(`${env.aiServiceUrl}/health/ready`, {
        timeout: 2500,
        headers: env.aiServiceApiKey ? { "x-ai-api-key": env.aiServiceApiKey } : undefined
      })
      .then(() => ({ status: "up" }))
      .catch((e) => ({ status: "down", error: e.message }))
  ]);

  const aiTimeoutSpike = metrics.ai.timeoutTotal >= env.aiTimeoutAlertThreshold;
  const ok = db.status === "up" && ai.status === "up" && !aiTimeoutSpike;

  return {
    ok,
    checks: {
      db,
      ai,
      observability: {
        status: aiTimeoutSpike ? "warn" : "up",
        aiTimeoutTotal: metrics.ai.timeoutTotal,
        threshold: env.aiTimeoutAlertThreshold,
        reason: aiTimeoutSpike ? "AI timeout threshold exceeded" : null
      }
    },
    durationMs: Date.now() - startedAt
  };
};

export const createApp = () => {
  const app = express();

  if (env.trustProxy) app.set("trust proxy", 1);

  app.use(attachRequestContext);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.requestId })
    })
  );

  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    res.on("finish", () => {
      const ended = process.hrtime.bigint();
      const durationMs = Number(ended - started) / 1e6;
      const route = req.route?.path ? `${req.baseUrl || ""}${req.route.path}` : req.path;
      recordRequest({ method: req.method, route, statusCode: res.statusCode, durationMs });
    });
    next();
  });

  app.use(
    helmet({
      hsts: env.isProd
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        : false
    })
  );
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(hpp());
  app.use(xssClean());

  app.use(buildLimiter(env.rateLimitGeneralMax, "Too many requests. Please try again later."));
  app.use("/api/auth", buildLimiter(env.rateLimitAuthMax, "Too many authentication attempts. Please wait."));
  app.use("/api/logs/upload", buildLimiter(env.rateLimitUploadMax, "Upload rate limit exceeded. Please retry later."));

  if (env.enforceCsrf) {
    app.use(
      csurf({
        cookie: {
          httpOnly: true,
          secure: env.csrfCookieSecure,
          sameSite: env.csrfCookieSameSite
        }
      })
    );
  }

  app.get("/health/live", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "cyberguard-backend",
      version: env.appVersion,
      uptimeSec: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString()
    });
  });

  app.get("/health/ready", async (_req, res) => {
    const deps = await checkDependencies();
    return res.status(deps.ok ? 200 : 503).json({
      status: deps.ok ? "ok" : "degraded",
      service: "cyberguard-backend",
      version: env.appVersion,
      uptimeSec: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
      checks: deps.checks,
      durationMs: deps.durationMs
    });
  });

  app.get("/metrics", (_req, res) => {
    res.status(200).json({
      service: "cyberguard-backend",
      version: env.appVersion,
      timestamp: new Date().toISOString(),
      metrics: getMetricsSnapshot()
    });
  });

  app.get("/health", async (_req, res) => {
    const deps = await checkDependencies();
    return res.status(deps.ok ? 200 : 503).json({
      status: deps.ok ? "ok" : "degraded",
      services: deps.checks,
      durationMs: deps.durationMs,
      timestamp: new Date().toISOString()
    });
  });

  app.use(attachTenantContext);
  app.use("/api", apiRoutes);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
