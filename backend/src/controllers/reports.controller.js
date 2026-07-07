import { getReportById, listReports, readReportFile } from "../services/reports.service.js";

export const getReports = async (req, res, next) => {
  try {
    const reports = await listReports();
    return res.json(reports);
  } catch (error) {
    return next(error);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    const file = readReportFile(report);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${report.fileName}`);
    return res.send(file);
  } catch (error) {
    return next(error);
  }
};
