import { StatusCodes } from "http-status-codes";
import {
  bulkCreateIncidentsFromLogs,
  createAlertRule,
  createSavedSearch,
  createSearchJob,
  deleteSavedSearch,
  listAlertRules,
  listSavedSearches,
  listSearchJobs,
  runSavedSearch,
  updateSearchJob
} from "../services/search-management.service.js";
import { exportEventsCsv, searchEvents } from "../services/search.service.js";

export const getEvents = async (req, res, next) => {
  try {
    const data = await searchEvents({
      query: req.query.query,
      from: req.query.from,
      to: req.query.to,
      severity: req.query.severity,
      page: req.query.page,
      pageSize: req.query.pageSize,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      tenantId: req.tenantId
    });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getEventsCsv = async (req, res, next) => {
  try {
    const csv = await exportEventsCsv({
      query: req.query.query,
      from: req.query.from,
      to: req.query.to,
      severity: req.query.severity,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      tenantId: req.tenantId
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=events-export.csv");
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};

export const getSavedSearches = async (req, res, next) => {
  try {
    const data = await listSavedSearches(req.user.sub);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const postSavedSearch = async (req, res, next) => {
  try {
    const data = await createSavedSearch(req.user.sub, req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const runSavedSearchController = async (req, res, next) => {
  try {
    const data = await runSavedSearch(req.user.sub, req.params.id, { ...req.query, tenantId: req.tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const deleteSavedSearchController = async (req, res, next) => {
  try {
    const data = await deleteSavedSearch(req.user.sub, req.params.id);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const getSearchJobs = async (req, res, next) => {
  try {
    const data = await listSearchJobs(req.user.sub);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const postSearchJob = async (req, res, next) => {
  try {
    const data = await createSearchJob(req.user.sub, req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const patchSearchJob = async (req, res, next) => {
  try {
    const data = await updateSearchJob(req.user.sub, req.params.id, req.body);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const getAlertRulesController = async (req, res, next) => {
  try {
    const data = await listAlertRules(req.user.sub);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const postAlertRuleController = async (req, res, next) => {
  try {
    const data = await createAlertRule(req.user.sub, req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postBulkIncidentController = async (req, res, next) => {
  try {
    const data = await bulkCreateIncidentsFromLogs({
      logIds: req.body.logIds || [],
      assignedToId: req.body.assignedToId,
      actorUserId: req.user.sub
    });
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};
