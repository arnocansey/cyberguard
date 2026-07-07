import { StatusCodes } from "http-status-codes";
import {
  addRuleVersion,
  createAsset,
  createReportSchedule,
  getComplianceOverview,
  getMlDrift,
  getUebaAnomalies,
  ingestIocs,
  listAssets,
  listIocs,
  listReportSchedules,
  listRuleVersions,
  listSoarPlaybooks,
  matchIocs,
  runSoarPlaybook,
  submitMlFeedback
} from "../services/enterprise.service.js";

export const getPlaybooks = async (_req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await listSoarPlaybooks());
  } catch (error) {
    return next(error);
  }
};

export const postRunPlaybook = async (req, res, next) => {
  try {
    const data = await runSoarPlaybook({
      playbookId: req.body.playbookId,
      alertId: req.body.alertId,
      targetIp: req.body.targetIp,
      tenantId: req.tenantId,
      actorUserId: req.user.sub
    });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getIocs = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await listIocs(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const postIocs = async (req, res, next) => {
  try {
    const data = await ingestIocs({
      tenantId: req.tenantId,
      indicators: req.body.indicators,
      source: req.body.source,
      actorUserId: req.user.sub
    });
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getIocMatches = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await matchIocs(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const getUeba = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await getUebaAnomalies(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const getAssetsController = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await listAssets(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const postAssetController = async (req, res, next) => {
  try {
    const data = await createAsset({ tenantId: req.tenantId, ...req.body });
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getComplianceController = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await getComplianceOverview(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const getReportSchedulesController = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await listReportSchedules(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const postReportScheduleController = async (req, res, next) => {
  try {
    const data = await createReportSchedule({ tenantId: req.tenantId, ...req.body });
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postMlFeedbackController = async (req, res, next) => {
  try {
    const data = await submitMlFeedback({ tenantId: req.tenantId, actorUserId: req.user.sub, ...req.body });
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getMlDriftController = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await getMlDrift(req.tenantId));
  } catch (error) {
    return next(error);
  }
};

export const getRuleVersionsController = async (req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json(await listRuleVersions(req.params.ruleId));
  } catch (error) {
    return next(error);
  }
};

export const postRuleVersionController = async (req, res, next) => {
  try {
    const data = await addRuleVersion({
      ruleId: req.params.ruleId,
      actorUserId: req.user.sub,
      query: req.body.query,
      notes: req.body.notes,
      severity: req.body.severity
    });
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};
