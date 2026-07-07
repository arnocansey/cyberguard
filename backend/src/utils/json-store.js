import { promises as fs } from "fs";
import path from "path";

const dataDir = path.resolve(process.cwd(), "data");

const ensureDataDir = async () => {
  await fs.mkdir(dataDir, { recursive: true });
};

export const readJsonStore = async (fileName, fallbackValue) => {
  await ensureDataDir();
  const filePath = path.join(dataDir, fileName);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2), "utf8");
    return fallbackValue;
  }
};

export const writeJsonStore = async (fileName, value) => {
  await ensureDataDir();
  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
  return value;
};
