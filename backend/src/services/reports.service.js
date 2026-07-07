import fs from "fs";
import { prisma } from "../config/prisma.js";

export const getReportById = (id) => prisma.report.findUnique({ where: { id } });

export const listReports = () =>
  prisma.report.findMany({
    include: {
      incident: {
        include: {
          alert: { include: { threat: true } }
        }
      }
    },
    orderBy: { generatedAt: "desc" }
  });

export const readReportFile = (report) => {
  if (!report || !fs.existsSync(report.storagePath)) return null;
  return fs.readFileSync(report.storagePath);
};
