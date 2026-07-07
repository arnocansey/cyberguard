import { jest } from "@jest/globals";

describe("Outgoing Active Response Integration Workflow", () => {
  let prismaMock;
  let axiosMock;

  beforeEach(async () => {
    jest.resetModules();

    prismaMock = {
      integration: {
        findMany: jest.fn()
      },
      alert: {
        findUnique: jest.fn()
      },
      soarExecution: {
        create: jest.fn()
      },
      auditLog: {
        create: jest.fn()
      }
    };
    await jest.unstable_mockModule("../src/config/prisma.js", () => ({ prisma: prismaMock }));

    axiosMock = {
      post: jest.fn()
    };
    await jest.unstable_mockModule("axios", () => ({ default: axiosMock }));
  });

  it("runSoarPlaybook makes outgoing webhook posts and records results in DB", async () => {
    prismaMock.integration.findMany.mockResolvedValue([
      {
        id: "int-1",
        name: "My Firewalled Web Server",
        tenantId: "test-tenant",
        type: "WEBHOOK",
        targetUrl: "https://my-other-website.com/api/cyberguard/webhook",
        secretKey: "website_secret_123",
        isActive: true
      }
    ]);

    prismaMock.alert.findUnique.mockResolvedValue({
      id: "alert-123",
      threat: {
        id: "threat-1",
        type: "SQL_INJECTION",
        log: { ipAddress: "192.168.5.5" }
      }
    });

    prismaMock.soarExecution.create.mockResolvedValue({
      id: "exec-1",
      playbookId: "pb_contain_web_attack",
      alertId: "alert-123",
      tenantId: "test-tenant",
      targetIp: "192.168.5.5",
      stepsExecuted: ["Block source IP", "Create incident", "Notify SOC channel"],
      status: "COMPLETED"
    });

    axiosMock.post.mockResolvedValue({
      status: 200,
      data: { success: true }
    });

    const { runSoarPlaybook } = await import("../src/services/enterprise.service.js");
    const execution = await runSoarPlaybook({
      playbookId: "pb_contain_web_attack",
      alertId: "alert-123",
      tenantId: "test-tenant",
      actorUserId: "user-admin"
    });

    expect(execution).toBeTruthy();
    expect(prismaMock.integration.findMany).toHaveBeenCalled();
    expect(axiosMock.post).toHaveBeenCalledWith(
      "https://my-other-website.com/api/cyberguard/webhook",
      expect.objectContaining({
        event: "cyberguard.playbook.mitigate",
        playbookId: "pb_contain_web_attack",
        action: "BLOCK_IP",
        targetIp: "192.168.5.5"
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-CyberGuard-Key": "website_secret_123"
        })
      })
    );
    expect(prismaMock.soarExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          playbookId: "pb_contain_web_attack",
          status: "COMPLETED",
          integrationResults: expect.arrayContaining([
            expect.objectContaining({
              integrationId: "int-1",
              status: "SUCCESS"
            })
          ])
        })
      })
    );
  });
});
