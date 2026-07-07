import { prisma } from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/security.js";

const upsertUser = async (email, fullName, role, password) =>
  prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      fullName,
      email,
      passwordHash: await hashPassword(password),
      role
    }
  });

const ensureDefaultPanels = async (userId) => {
  const count = await prisma.dashboardPanel.count({ where: { userId } });
  if (count > 0) return;

  await prisma.dashboardPanel.createMany({
    data: [
      { userId, title: "All Events (24h)", query: "", vizType: "METRIC", position: 0 },
      { userId, title: "Apache Errors", query: "source=apache status>=400", vizType: "TABLE", position: 1 }
    ]
  });
};

const main = async () => {
  const admin = await upsertUser("admin@cyber.local", "Platform Admin", "ADMIN", "ChangeMe123!");
  await upsertUser("analyst@cyber.local", "SOC Analyst", "SECURITY_ANALYST", "ChangeMe123!");
  await ensureDefaultPanels(admin.id);
};

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
