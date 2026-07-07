import { getThreatStats, getThreats } from "../services/threats.service.js";

export const listThreats = async (req, res, next) => {
  try {
    const data = await getThreats(req.tenantId);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const statsThreats = async (req, res, next) => {
  try {
    const data = await getThreatStats(req.tenantId);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};
