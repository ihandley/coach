import { execSync } from "node:child_process";

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

  process.env.SUPABASE_URL ??= getSecret("coach_SUPABASE_URL");
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= getSecret(
    "coach_SUPABASE_SERVICE_ROLE_KEY",
  );
}