import dotenv from "dotenv";

dotenv.config();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const parseCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

const allowedSeverity = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const parsedEscalationSeverities = parseCsv(process.env.ALERT_ESCALATION_SEVERITIES, ["HIGH", "CRITICAL"])
  .map((v) => String(v).toUpperCase())
  .filter((v) => allowedSeverity.has(v));

const escalationTargetSeverity = String(process.env.ALERT_ESCALATION_TARGET_SEVERITY || "CRITICAL").toUpperCase();

const env = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT || 5000),
  appVersion: process.env.APP_VERSION || "1.0.0",
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "access_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refresh_secret",
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  aiServiceApiKey: process.env.AI_SERVICE_API_KEY || "",
  aiServiceTimeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS || 5000),
  aiTimeoutAlertThreshold: Number(process.env.AI_TIMEOUT_ALERT_THRESHOLD || 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  corsAllowedOrigins: parseCsv(process.env.CORS_ALLOWED_ORIGINS, [process.env.FRONTEND_ORIGIN || "http://localhost:3000"]),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  enforceCsrf: parseBoolean(process.env.ENFORCE_CSRF, isProd),
  csrfCookieSecure: parseBoolean(process.env.CSRF_COOKIE_SECURE, isProd),
  csrfCookieSameSite: process.env.CSRF_COOKIE_SAMESITE || "lax",
  rateLimitGeneralMax: Number(process.env.RATE_LIMIT_GENERAL_MAX || 300),
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 30),
  rateLimitUploadMax: Number(process.env.RATE_LIMIT_UPLOAD_MAX || 60),
  requireStrongSecrets: parseBoolean(process.env.REQUIRE_STRONG_SECRETS, isProd),
  defaultTenantId: process.env.DEFAULT_TENANT_ID || "default",
  allowAdminTenantOverride: parseBoolean(process.env.ALLOW_ADMIN_TENANT_OVERRIDE, true),
  superAdminEmails: parseCsv(process.env.SUPER_ADMIN_EMAILS, []).map((e) => e.toLowerCase()),

  schedulerEnabled: parseBoolean(process.env.SCHEDULER_ENABLED, true),
  schedulerTickSeconds: Math.max(15, Number(process.env.SCHEDULER_TICK_SECONDS || 60)),

  searchJobCron: process.env.SEARCH_JOB_CRON || "* * * * *",

  autoThreatScanEnabled: parseBoolean(process.env.AUTO_THREAT_SCAN_ENABLED, true),
  autoThreatScanCron: process.env.AUTO_THREAT_SCAN_CRON || "*/5 * * * *",
  autoThreatScanBatchSize: Math.max(10, Number(process.env.AUTO_THREAT_SCAN_BATCH_SIZE || 200)),

  alertEscalationEnabled: parseBoolean(process.env.ALERT_ESCALATION_ENABLED, true),
  alertEscalationCron: process.env.ALERT_ESCALATION_CRON || "*/5 * * * *",
  alertEscalationMinutes: Math.max(1, Number(process.env.ALERT_ESCALATION_MINUTES || 15)),
  alertEscalationSeverities: parsedEscalationSeverities.length ? parsedEscalationSeverities : ["HIGH", "CRITICAL"],
  alertEscalationTargetSeverity: allowedSeverity.has(escalationTargetSeverity) ? escalationTargetSeverity : "CRITICAL",
  alertEscalationMaxPerRun: Math.max(1, Number(process.env.ALERT_ESCALATION_MAX_PER_RUN || 100))
};

if (env.requireStrongSecrets) {
  const weakSecrets = ["access_secret", "refresh_secret", "replace_access_secret", "replace_refresh_secret"];
  if (weakSecrets.includes(env.jwtAccessSecret) || weakSecrets.includes(env.jwtRefreshSecret)) {
    throw new Error("Weak JWT secrets detected. Set strong JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.");
  }

  if (env.jwtAccessSecret.length < 24 || env.jwtRefreshSecret.length < 24) {
    throw new Error("JWT secrets must be at least 24 characters when REQUIRE_STRONG_SECRETS=true.");
  }
}

export { env };