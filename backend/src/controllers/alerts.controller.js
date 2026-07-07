import { StatusCodes } from "http-status-codes";
import { listAlerts, triageAlert } from "../services/alerts.service.js";

export const getAlerts = async (req, res, next) => {
  try {
    const data = await listAlerts(req.query);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const patchAlert = async (req, res, next) => {
  try {
    const data = await triageAlert(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};
