import { spawnSync } from "node:child_process";
import path from "node:path";

const FIXED_PRD_ENV = {
  APP_ENV: "production",
  NEXT_PUBLIC_APP_ENV: "production",
  JOB_COACH_APP_URL: "http://localhost:3001",
  NODE_ENV: "production",
  PORT: "3001",
} as const;

function loadProductionEnv(): void {
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
  "SUPABASE_URL_PRD",
  "SUPABASE_SERVICE_ROLE_KEY_PRD",
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
