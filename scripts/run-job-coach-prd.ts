import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILE = path.join("apps", "job-coach-web", ".env.production.local");
const FIXED_PRD_ENV = {
  APP_ENV: "production",
  NEXT_PUBLIC_APP_ENV: "production",
  JOB_COACH_APP_URL: "http://localhost:3001",
  NODE_ENV: "production",
  PORT: "3001",
} as const;

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadProductionEnv(): void {
  if (!existsSync(ENV_FILE)) {
    console.error(`Missing ${ENV_FILE}.`);
    console.error("Create it from docs/job-coach-environments.md before starting PRD.");
    process.exit(1);
  }

  const values = parseEnvFile(readFileSync(ENV_FILE, "utf8"));

  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }

  for (const [key, value] of Object.entries(FIXED_PRD_ENV)) {
    process.env[key] = value;
  }
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    console.error(`Missing required PRD environment variable: ${name}`);
    process.exit(1);
  }
}

const command = process.argv[2];

if (command !== "build" && command !== "start") {
  console.error("Usage: pnpm tsx scripts/run-job-coach-prd.ts <build|start>");
  process.exit(1);
}

loadProductionEnv();

for (const name of [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "APP_ENV",
  "NEXT_PUBLIC_APP_ENV",
  "JOB_COACH_APP_URL",
  "PORT",
]) {
  requireEnv(name);
}

console.log(`Job Coach PRD - ${FIXED_PRD_ENV.JOB_COACH_APP_URL}`);

const result = spawnSync("pnpm", ["--filter", "job-coach-web", command], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
