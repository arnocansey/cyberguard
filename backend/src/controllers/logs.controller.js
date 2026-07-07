import { StatusCodes } from "http-status-codes";
import { clearAllLogs, getLogById, getLogs, processUploadedLogs } from "../services/logs.service.js";

export const uploadLogs = async (req, res, next) => {
  try {
    const text = req.file?.buffer?.toString("utf8");
    if (!text) return res.status(400).json({ message: "Log file required" });
    const data = await processUploadedLogs(text, req.body.source || "apache", req.tenantId);
    const io = req.app.get("io");
    for (const item of data.threats) {
      io.emit("threat-alert", {
        alertId: item.alert.id,
        severity: item.alert.severity,
        type: item.threat.type,
        confidence: item.threat.confidence
      });
    }
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const listLogs = async (req, res, next) => {
  try {
    const data = await getLogs(req.tenantId);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getLog = async (req, res, next) => {
  try {
    const data = await getLogById(req.params.id, req.tenantId);
    if (!data) return res.status(404).json({ message: "Log not found" });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const deleteLogs = async (req, res, next) => {
  try {
    const result = await clearAllLogs(req.tenantId);
    return res.status(StatusCodes.OK).json({ message: "All logs cleared", deleted: result.count, tenantId: req.tenantId });
  } catch (error) {
    return next(error);
  }
};
