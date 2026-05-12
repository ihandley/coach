import { spawnSync } from "node:child_process";

const FIXED_PRD_ENV = {
  APP_ENV: "production",
  NEXT_PUBLIC_APP_ENV: "production",
  NEXT_PUBLIC_ENABLE_JOB_COACH: "true",
  NODE_ENV: "production",
  PORT: "3001",
} as const;

function loadProductionEnv(): void {
  for (const [key, value] of Object.entries(FIXED_PRD_ENV)) {
    process.env[key] = value;
  }
}

const command = process.argv[2];

if (command !== "build" && command !== "start") {
  console.error("Usage: tsx scripts/run-job-coach-prd.ts <build|start>");
  process.exit(1);
}

loadProductionEnv();

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.SUPABASE_URL_PRD;
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY_PRD;

for (const name of [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "APP_ENV",
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_ENABLE_JOB_COACH",
  "NODE_ENV",
  "PORT",
]) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const appDir = "apps/job-coach-web";
const nextCommand = command === "build" ? "build" : "start";

const result = spawnSync("pnpm", ["--dir", appDir, nextCommand], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
