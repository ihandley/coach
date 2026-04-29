import { execSync } from "node:child_process";

type AppEnv = "development" | "production";

function getAppEnv(): AppEnv {
  const appEnv = process.env.APP_ENV ?? "development";

  if (appEnv !== "development" && appEnv !== "production") {
    throw new Error(
      `Invalid APP_ENV "${appEnv}". Expected "development" or "production".`,
    );
  }

  return appEnv;
}

function getSecret(account: string): string {
  return execSync(
    `security find-generic-password -a "$USER" -s "${account}" -w`,
    { encoding: "utf8" },
  ).trim();
}

export function loadEnvFromKeychain(): void {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  if (process.platform !== "darwin") {
    return;
  }

  const appEnv = getAppEnv();
  const keychainEnv = appEnv === "production" ? "prd" : "dev";

  process.env.SUPABASE_URL ??= getSecret(`coach_${keychainEnv}_SUPABASE_URL`);
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= getSecret(
    `coach_${keychainEnv}_SUPABASE_SERVICE_ROLE_KEY`,
  );
}
