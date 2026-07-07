import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Missing token", requestId: req.requestId });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret);
    return next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token", requestId: req.requestId });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden", requestId: req.requestId });
  }
  return next();
};
