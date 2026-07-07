import { execSync } from "child_process";

const url = process.env.DATABASE_URL;
const file = process.argv[2];

if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!file) {
  console.error("Usage: npm run restore -- <backup.sql>");
  process.exit(1);
}

execSync(`psql "${url}" -f "${file}"`, { stdio: "inherit" });
console.log(`Restore completed from ${file}`);
