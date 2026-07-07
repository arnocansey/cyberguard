import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";

describe("smoke workflow", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("auth login returns tokens for seeded-style user", async () => {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "u-admin",
          email: "admin@cyber.local",
          role: "ADMIN",
          passwordHash,
          twoFaEnabled: false,
          twoFaConfig: null
        })
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: "rt-1" })
      }
    };

    await jest.unstable_mockModule("../src/config/prisma.js", () => ({ prisma: prismaMock }));
    const { loginUser } = await import("../src/services/auth.service.js");

    const out = await loginUser({ email: "admin@cyber.local", password: "ChangeMe123!" });

    expect(out.accessToken).toBeTruthy();
    expect(out.refreshToken).toBeTruthy();
    expect(out.user.role).toBe("ADMIN");
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it("log ingestion creates threats from AI predictions", async () => {
    const prismaMock = {
      log: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: "l1", parsedJson: { path: "/a", method: "GET", statusCode: 200 } })
          .mockResolvedValueOnce({ id: "l2", parsedJson: { path: "/b", method: "POST", statusCode: 500 } })
      },
      threat: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: "t1", type: "BENIGN", severity: "LOW", confidence: 0.8 })
          .mockResolvedValueOnce({ id: "t2", type: "SQL_INJECTION", severity: "CRITICAL", confidence: 0.91 })
      },
      alert: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: "a1", severity: "LOW", threat: { id: "t1" } })
          .mockResolvedValueOnce({ id: "a2", severity: "CRITICAL", threat: { id: "t2" } })
      }
    };

    const axiosPost = jest.fn().mockResolvedValue({
      data: {
        modelVersion: "threat-rf-v1",
        predictions: [
          { logId: "l1", label: "BENIGN", confidence: 0.8 },
          { logId: "l2", label: "SQL_INJECTION", confidence: 0.91 }
        ]
      }
    });

    await jest.unstable_mockModule("../src/config/prisma.js", () => ({ prisma: prismaMock }));
    await jest.unstable_mockModule("axios", () => ({ default: { post: axiosPost } }));

    const { processUploadedLogs } = await import("../src/services/logs.service.js");

    const raw = '127.0.0.1 - - [17/Feb/2026:10:00:00 +0000] "GET /index HTTP/1.1" 200 100\n127.0.0.2 - - [17/Feb/2026:10:00:02 +0000] "POST /login HTTP/1.1" 500 88';
    const result = await processUploadedLogs(raw, "apache");

    expect(result.processed).toBe(2);
    expect(result.threats).toHaveLength(2);
    expect(prismaMock.threat.create).toHaveBeenCalledTimes(2);
    expect(axiosPost).toHaveBeenCalledTimes(1);
  });

  it("closing incident triggers report upsert", async () => {
    const prismaMock = {
      incident: {
        update: jest.fn().mockResolvedValue({
          id: "inc-1",
          alertId: "alert-1",
          status: "CLOSED",
          alert: { threat: { type: "SQL_INJECTION" }, severity: "CRITICAL" },
          notes: []
        })
      },
      report: {
        upsert: jest.fn().mockResolvedValue({ id: "rep-1" })
      }
    };

    await jest.unstable_mockModule("../src/config/prisma.js", () => ({ prisma: prismaMock }));
    await jest.unstable_mockModule("../src/utils/pdf.js", () => ({
      generateIncidentPdf: jest.fn().mockResolvedValue({ fileName: "incident-inc-1.pdf", filePath: "reports/incident-inc-1.pdf" })
    }));

    const { updateIncident } = await import("../src/services/incidents.service.js");

    await updateIncident("inc-1", { status: "CLOSED", resolution: "Mitigated", note: "Closed in smoke" }, "u-admin");

    expect(prismaMock.incident.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.report.upsert).toHaveBeenCalledTimes(1);
  });
});
