import { StatusCodes } from "http-status-codes";
import {
  exportAuditLogsCsv,
  exportUsersCsv,
  getAdminSchedulerStatus,
  getAdminSummary,
  listAuditLogs,
  listUsers,
  runAdminSchedulerTask,
  updateUserRole
} from "../services/admin.service.js";

export const getSummary = async (req, res, next) => {
  try {
    const data = await getAdminSummary();
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const data = await listUsers({
      search: req.query.search,
      role: req.query.role,
      page: req.query.page,
      pageSize: req.query.pageSize,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getUsersCsv = async (req, res, next) => {
  try {
    const csv = await exportUsersCsv({
      search: req.query.search,
      role: req.query.role,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=admin-users.csv");
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};

export const patchUserRole = async (req, res, next) => {
  try {
    const data = await updateUserRole(req.params.id, req.body.role);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const data = await listAuditLogs({
      search: req.query.search,
      page: req.query.page,
      pageSize: req.query.pageSize,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getAuditLogsCsv = async (req, res, next) => {
  try {
    const csv = await exportAuditLogsCsv({
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};

export const getScheduler = async (_req, res, next) => {
  try {
    const data = getAdminSchedulerStatus();
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const runSchedulerTask = async (req, res, next) => {
  try {
    const data = await runAdminSchedulerTask(req.body.task);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};