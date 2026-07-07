import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const backupsDir = path.resolve("backups");
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

const outFile = path.join(backupsDir, `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`);
execSync(`pg_dump "${url}" -f "${outFile}"`, { stdio: "inherit" });
console.log(`Backup saved to ${outFile}`);
