import { StatusCodes } from "http-status-codes";
import {
  applyLayout,
  createPanel,
  getPanelData,
  listLayouts,
  listPanels,
  reorderPanels,
  saveCurrentLayout,
  updatePanel
} from "../services/dashboard.service.js";

export const getPanels = async (req, res, next) => {
  try {
    const data = await listPanels(req.user.sub);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postPanel = async (req, res, next) => {
  try {
    const data = await createPanel(req.user.sub, req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const patchPanel = async (req, res, next) => {
  try {
    const data = await updatePanel(req.user.sub, req.params.id, req.body);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postPanelReorder = async (req, res, next) => {
  try {
    const data = await reorderPanels(req.user.sub, req.body.panelIds || []);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getPanelDataController = async (req, res, next) => {
  try {
    const data = await getPanelData(req.user.sub, req.params.id, req.query.from, req.query.to);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getLayoutsController = async (req, res, next) => {
  try {
    const data = await listLayouts(req.user.sub, req.user.role, req.query.teamKey);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postLayoutController = async (req, res, next) => {
  try {
    const data = await saveCurrentLayout(req.user.sub, req.user.role, req.body);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const postApplyLayoutController = async (req, res, next) => {
  try {
    const data = await applyLayout(req.user.sub, req.user.role, req.params.id, req.body.teamKey);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};
