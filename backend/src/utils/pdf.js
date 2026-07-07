import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const generateIncidentPdf = (incident) =>
  new Promise((resolve, reject) => {
    const reportsDir = path.resolve("reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const fileName = `incident-${incident.id}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(18).text("Incident Report");
    doc.moveDown();
    doc.fontSize(12).text(`Incident ID: ${incident.id}`);
    doc.text(`Status: ${incident.status}`);
    doc.text(`Severity: ${incident.alert.severity}`);
    doc.text(`Threat Type: ${incident.alert.threat.type}`);
    doc.text(`Created At: ${incident.createdAt.toISOString()}`);
    doc.moveDown();
    doc.text(`Resolution: ${incident.resolution || "Pending"}`);
    doc.end();
    stream.on("finish", () => resolve({ fileName, filePath }));
    stream.on("error", reject);
  });

