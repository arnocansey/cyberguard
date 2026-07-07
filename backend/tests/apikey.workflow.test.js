import { jest } from "@jest/globals";
import request from "supertest";

describe("API Key Ingestion Workflow", () => {
  let app;
  let prismaMock;

  beforeEach(async () => {
    jest.resetModules();
    
    prismaMock = {
      apiKey: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: "key-1" })
      },
      log: {
        create: jest.fn()
      },
      threat: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null)
      },
      alert: {
        create: jest.fn()
      }
    };

    await jest.unstable_mockModule("../src/config/prisma.js", () => ({ prisma: prismaMock }));

    const axiosMock = {
      post: jest.fn().mockResolvedValue({
        data: {
          predictions: [
            {
              logId: "log-1",
              label: "SQL_INJECTION",
              confidence: 0.95,
              modelVersion: "threat-rf-v1",
              explanation: { reason: "sql keyword found" },
              guidance: { summary: "Potential SQL injection payload detected" }
            }
          ],
          modelVersion: "threat-rf-v1"
        }
      })
    };
    await jest.unstable_mockModule("axios", () => ({ default: axiosMock }));

    const { createApp } = await import("../src/app.js");
    app = createApp();
  });

  it("fails log ingestion when X-API-Key header is missing", async () => {
    const res = await request(app)
      .post("/api/logs/ingest")
      .send({ path: "/login", method: "POST", statusCode: 200 });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing API Key");
  });

  it("fails log ingestion when API key is invalid", async () => {
    prismaMock.apiKey.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/logs/ingest")
      .set("X-API-Key", "invalid_key")
      .send({ path: "/login", method: "POST", statusCode: 200 });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or inactive API Key");
  });

  it("successfully ingests log when API key is valid", async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    prismaMock.apiKey.findUnique.mockResolvedValue({
      id: "key-1",
      name: "Test Ingestion Key",
      tenantId: "test-tenant",
      isActive: true,
      expiresAt
    });

    prismaMock.log.create.mockResolvedValue({
      id: "log-1",
      source: "external_api",
      sourcetype: "external_api",
      host: "localhost",
      raw: "[JSON] POST /login 200",
      parsedJson: { path: "/login", method: "POST", statusCode: 200 },
      ipAddress: "127.0.0.1",
      method: "POST",
      path: "/login",
      statusCode: 200,
      tenantId: "test-tenant"
    });

    prismaMock.threat.create.mockResolvedValue({
      id: "threat-1",
      logId: "log-1",
      type: "SQL_INJECTION",
      confidence: 0.95,
      severity: "CRITICAL"
    });

    prismaMock.alert.create.mockResolvedValue({
      id: "alert-1",
      threatId: "threat-1",
      message: "SQL_INJECTION detected",
      severity: "CRITICAL",
      threat: { id: "threat-1", type: "SQL_INJECTION", severity: "CRITICAL", confidence: 0.95 }
    });

    const res = await request(app)
      .post("/api/logs/ingest")
      .set("X-API-Key", "cg_ingest_test")
      .send({ path: "/login", method: "POST", statusCode: 200 });

    expect(res.status).toBe(201);
    expect(res.body.processed).toBe(1);
    expect(res.body.threats.length).toBe(1);
    expect(res.body.threats[0].threat.type).toBe("SQL_INJECTION");
    expect(prismaMock.apiKey.findUnique).toHaveBeenCalled();
    expect(prismaMock.log.create).toHaveBeenCalled();
  });
});
