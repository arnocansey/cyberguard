import { StatusCodes } from "http-status-codes";
import { createIncident, getIncidentTimeline, listIncidents, updateIncident } from "../services/incidents.service.js";

export const postIncident = async (req, res, next) => {
  try {
    const data = await createIncident(req.body, req.user.sub);
    return res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const patchIncident = async (req, res, next) => {
  try {
    const data = await updateIncident(req.params.id, req.body, req.user.sub);
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getIncidents = async (req, res, next) => {
  try {
    const data = await listIncidents();
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getIncidentTimelineController = async (req, res, next) => {
  try {
    const data = await getIncidentTimeline(req.params.id);
    if (!data) return res.status(StatusCodes.NOT_FOUND).json({ message: "Incident not found" });
    return res.status(StatusCodes.OK).json(data);
  } catch (error) {
    return next(error);
  }
};
