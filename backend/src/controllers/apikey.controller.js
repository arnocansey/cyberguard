import { StatusCodes } from "http-status-codes";
import { generateApiKey, listApiKeys, revokeApiKey } from "../services/apikey.service.js";

export const createKey = async (req, res, next) => {
  try {
    const { name, expiresDays } = req.body;
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Key name is required" });
    }
    const result = await generateApiKey({
      name,
      tenantId: req.tenantId,
      expiresDays
    });
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getKeys = async (req, res, next) => {
  try {
    const result = await listApiKeys(req.tenantId);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

export const deleteKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await revokeApiKey(id, req.tenantId);
    if (result.count === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "API key not found" });
    }
    return res.status(StatusCodes.OK).json({ message: "API key revoked successfully" });
  } catch (error) {
    return next(error);
  }
};
