import { StatusCodes } from "http-status-codes";
import { createIntegration, deleteIntegration, listIntegrations } from "../services/integration.service.js";

export const addIntegration = async (req, res, next) => {
  try {
    const { name, type, targetUrl, secretKey } = req.body;
    if (!name || !targetUrl || !secretKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "name, targetUrl, and secretKey are required"
      });
    }

    const result = await createIntegration({
      name,
      type,
      targetUrl,
      secretKey,
      tenantId: req.tenantId
    });

    const { secretKey: _, ...maskedResult } = result;
    return res.status(StatusCodes.CREATED).json(maskedResult);
  } catch (error) {
    return next(error);
  }
};

export const getIntegrations = async (req, res, next) => {
  try {
    const result = await listIntegrations(req.tenantId);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

export const removeIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteIntegration(id, req.tenantId);
    if (result.count === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Integration not found" });
    }
    return res.status(StatusCodes.OK).json({ message: "Integration removed successfully" });
  } catch (error) {
    return next(error);
  }
};
