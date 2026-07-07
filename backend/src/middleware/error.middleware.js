import { StatusCodes } from "http-status-codes";
import { recordError } from "../config/metrics.js";

export const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: "Route not found",
    requestId: req.requestId
  });
};

export const errorHandler = (err, req, res, next) => {
  recordError();

  if (err?.code === "P1001") {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      message: "Database is unreachable. Check DATABASE_URL/network and try again.",
      requestId: req.requestId
    });
  }

  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal server error";
  return res.status(status).json({ message, requestId: req.requestId });
};
