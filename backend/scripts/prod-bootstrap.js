import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

const fail = (msg) => {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
};

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL is required for production bootstrap.");
}

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  fail("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required.");
}

try {
  run("npm ci");
  run("npx prisma generate");
  run("npx prisma migrate deploy");

  if (process.env.RUN_SEED === "true") {
    run("node prisma/seed.js");
  }

  console.log("\nProduction bootstrap completed successfully.");
} catch (error) {
  fail(error.message);
}
