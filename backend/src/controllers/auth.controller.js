import { StatusCodes } from "http-status-codes";
import {
  disableTwoFa,
  getCurrentUserProfile,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  revokeAllSessions,
  setupTwoFa,
  verifyTwoFa
} from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const data = await registerUser(req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await loginUser({ ...req.body, tenantId: req.tenantId });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const data = await refreshSession(req.body);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const data = await logoutUser(req.body);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUserProfile(req.user.sub);
    return res.status(StatusCodes.OK).json({
      user,
      tenant: {
        tokenTenantId: req.user.tenantId || null,
        effectiveTenantId: req.tenantId,
        meta: req.tenantMeta || null
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const setup2FaController = async (req, res, next) => {
  try {
    const data = await setupTwoFa(req.user.sub);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const verify2FaController = async (req, res, next) => {
  try {
    const data = await verifyTwoFa(req.user.sub, req.body.code);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const disable2FaController = async (req, res, next) => {
  try {
    const data = await disableTwoFa(req.user.sub);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const revokeSessionsController = async (req, res, next) => {
  try {
    const data = await revokeAllSessions(req.user.sub);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};
