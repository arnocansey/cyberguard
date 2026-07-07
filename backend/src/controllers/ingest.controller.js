import { StatusCodes } from "http-status-codes";
import { processIngestedLogs } from "../services/logs.service.js";

export const ingestLogs = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Payload is required" });
    }

    const logsArray = Array.isArray(payload) ? payload : [payload];
    if (logsArray.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "No log entries found in payload" });
    }

    const source = req.query.source || "external_api";
    const data = await processIngestedLogs(logsArray, source, req.tenantId);

    const io = req.app.get("io");
    if (io) {
      for (const item of data.threats) {
        io.emit("threat-alert", {
          alertId: item.alert.id,
          severity: item.alert.severity,
          type: item.threat.type,
          confidence: item.threat.confidence
        });
      }
    }

    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};
