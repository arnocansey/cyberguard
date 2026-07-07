import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

const resolveTenantId = (user, context = {}) => context.tenantId || user.tenantId || env.defaultTenantId;

export const signAccessToken = (user, context = {}) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      tenantId: resolveTenantId(user, context)
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenExpires
    }
  );

export const signRefreshToken = (user, context = {}) =>
  jwt.sign(
    {
      sub: user.id,
      tenantId: resolveTenantId(user, context)
    },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpires }
  );
