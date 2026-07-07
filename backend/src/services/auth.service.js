import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { comparePassword, hashPassword, sha256, signAccessToken, signRefreshToken } from "../utils/security.js";

const decodeRefresh = (token) => jwt.verify(token, env.jwtRefreshSecret);

const buildRefreshTokenRecord = (refreshToken, userId) => {
  const decoded = jwt.decode(refreshToken);
  return {
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(decoded.exp * 1000)
  };
};

export const registerUser = async (payload) => {
  const exists = await prisma.user.findUnique({ where: { email: payload.email } });
  if (exists) throw Object.assign(new Error("Email already used"), { status: 409 });

  const passwordHash = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: { fullName: payload.fullName, email: payload.email, passwordHash, role: payload.role }
  });

  return { id: user.id, email: user.email, role: user.role };
};

export const loginUser = async ({ email, password, twoFaCode, tenantId }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { twoFaConfig: true }
  });
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  if (user.twoFaEnabled) {
    if (!twoFaCode || !user.twoFaConfig?.secret) {
      throw Object.assign(new Error("2FA code required"), { status: 401 });
    }
    const isValidCode = authenticator.verify({ token: twoFaCode, secret: user.twoFaConfig.secret });
    if (!isValidCode) throw Object.assign(new Error("Invalid 2FA code"), { status: 401 });
  }

  const resolvedTenantId = tenantId || env.defaultTenantId;
  const accessToken = signAccessToken(user, { tenantId: resolvedTenantId });
  const refreshToken = signRefreshToken(user, { tenantId: resolvedTenantId });

  await prisma.refreshToken.create({ data: buildRefreshTokenRecord(refreshToken, user.id) });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, twoFaEnabled: user.twoFaEnabled, tenantId: resolvedTenantId }
  };
};

export const refreshSession = async ({ refreshToken }) => {
  const payload = decodeRefresh(refreshToken);
  const tokenHash = sha256(refreshToken);

  const token = await prisma.refreshToken.findFirst({
    where: { tokenHash, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true }
  });

  if (!token) throw Object.assign(new Error("Invalid refresh token"), { status: 401 });

  const resolvedTenantId = payload.tenantId || env.defaultTenantId;
  const nextAccessToken = signAccessToken(token.user, { tenantId: resolvedTenantId });
  const nextRefreshToken = signRefreshToken(token.user, { tenantId: resolvedTenantId });

  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({ data: buildRefreshTokenRecord(nextRefreshToken, token.user.id) })
  ]);

  return { accessToken: nextAccessToken, refreshToken: nextRefreshToken };
};

export const logoutUser = async ({ refreshToken }) => {
  const tokenHash = sha256(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  return { message: "Logged out" };
};

export const setupTwoFa = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, "CyberGuard", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  await prisma.twoFaConfig.upsert({
    where: { userId },
    update: { secret, tempSecret: secret },
    create: { userId, secret, tempSecret: secret }
  });

  return { otpauth, qrCodeDataUrl };
};

export const verifyTwoFa = async (userId, code) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { twoFaConfig: true }
  });
  if (!user?.twoFaConfig?.tempSecret) {
    throw Object.assign(new Error("2FA setup not initialized"), { status: 400 });
  }

  const verified = authenticator.verify({ token: code, secret: user.twoFaConfig.tempSecret });
  if (!verified) throw Object.assign(new Error("Invalid 2FA code"), { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { twoFaEnabled: true } }),
    prisma.twoFaConfig.update({
      where: { userId },
      data: { secret: user.twoFaConfig.tempSecret, tempSecret: null }
    })
  ]);

  return { message: "2FA enabled" };
};

export const disableTwoFa = async (userId) => {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { twoFaEnabled: false } }),
    prisma.twoFaConfig.deleteMany({ where: { userId } })
  ]);
  return { message: "2FA disabled" };
};

export const revokeAllSessions = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  return { message: "All sessions revoked" };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      twoFaEnabled: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  return user;
};
