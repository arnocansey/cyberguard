import { prisma } from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/security.js";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "ChangeMe123!";

const ensureDefaultPanels = async (userId) => {
  await prisma.dashboardPanel.deleteMany({ where: { userId } });
  await prisma.dashboardPanel.createMany({
    data: [
      { userId, title: "All Events (24h)", query: "", vizType: "METRIC", position: 0 },
      { userId, title: "Apache Errors", query: "source=apache status>=400", vizType: "TABLE", position: 1 },
      { userId, title: "High Severity Threats", query: "severity=HIGH", vizType: "PIE", position: 2 }
    ]
  });
};

const seedUsers = async () => {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cyber.local" },
    update: { fullName: "Platform Admin", role: "ADMIN", passwordHash, twoFaEnabled: false },
    create: { fullName: "Platform Admin", email: "admin@cyber.local", role: "ADMIN", passwordHash, twoFaEnabled: false }
  });

  await prisma.user.upsert({
    where: { email: "analyst@cyber.local" },
    update: { fullName: "SOC Analyst", role: "SECURITY_ANALYST", passwordHash, twoFaEnabled: false },
    create: { fullName: "SOC Analyst", email: "analyst@cyber.local", role: "SECURITY_ANALYST", passwordHash, twoFaEnabled: false }
  });

  return { admin };
};

const resetData = async () => {
  await prisma.$transaction([
    prisma.report.deleteMany(),
    prisma.incidentNote.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.alert.deleteMany(),
    prisma.threat.deleteMany(),
    prisma.log.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.twoFaConfig.deleteMany(),
    prisma.searchJob.deleteMany(),
    prisma.savedSearch.deleteMany(),
    prisma.alertRule.deleteMany(),
    prisma.dashboardLayout.deleteMany(),
    prisma.dashboardPanel.deleteMany(),
    prisma.correlationRule.deleteMany()
  ]);
};

const main = async () => {
  console.log("Resetting demo data...");
  await resetData();
  const { admin } = await seedUsers();
  await ensureDefaultPanels(admin.id);
  console.log("Demo reset complete.");
  console.log("Admin login: admin@cyber.local / " + DEMO_PASSWORD);
  console.log("Analyst login: analyst@cyber.local / " + DEMO_PASSWORD);
};

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
