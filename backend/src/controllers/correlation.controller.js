import { StatusCodes } from "http-status-codes";
import {
  createCorrelationRule,
  deleteCorrelationRule,
  listCorrelationRules,
  simulateCorrelationRule,
  updateCorrelationRule
} from "../services/correlation.service.js";

export const getCorrelationRules = async (req, res, next) => {
  try {
    const data = await listCorrelationRules();
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postCorrelationRule = async (req, res, next) => {
  try {
    const data = await createCorrelationRule(req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const patchCorrelationRule = async (req, res, next) => {
  try {
    const data = await updateCorrelationRule(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const removeCorrelationRule = async (req, res, next) => {
  try {
    const data = await deleteCorrelationRule(req.params.id);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const simulateCorrelationRuleController = async (req, res, next) => {
  try {
    const data = await simulateCorrelationRule(req.params.id, req.query.from, req.query.to);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};
