import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const normalizeTenant = (value) => String(value || "").trim();

const readUserFromToken = (req) => {
  if (req.user) return req.user;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch {
    return null;
  }
};

export const attachTenantContext = (req, _res, next) => {
  const headerTenant = normalizeTenant(req.headers["x-tenant-id"]);
  const tokenUser = readUserFromToken(req);

  if (!tokenUser) {
    req.tenantId = headerTenant || env.defaultTenantId;
    req.tenantMeta = {
      source: headerTenant ? "header" : "default",
      tokenTenantId: null,
      overrideApplied: false
    };
    return next();
  }

  const tokenTenant = normalizeTenant(tokenUser.tenantId) || env.defaultTenantId;
  const role = tokenUser.role;
  const email = String(tokenUser.email || "").toLowerCase();

  const isSuperAdmin = env.superAdminEmails.includes(email);
  const canAdminOverride = role === "ADMIN" && env.allowAdminTenantOverride;
  const canOverride = isSuperAdmin || canAdminOverride;

  let effectiveTenant = tokenTenant;
  let overrideApplied = false;

  if (headerTenant && headerTenant !== tokenTenant && canOverride) {
    effectiveTenant = headerTenant;
    overrideApplied = true;
  }

  req.tenantId = effectiveTenant;
  req.tenantMeta = {
    source: overrideApplied ? "header-override" : "token",
    tokenTenantId: tokenTenant,
    overrideApplied,
    isSuperAdmin,
    canOverride
  };

  return next();
};
