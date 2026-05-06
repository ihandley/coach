import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const scriptPath = path.join("scripts", "require-dev-env.ts");
const productionConfirmation = "RESET_PRODUCTION_JOB_COACH_DATA";

function runGuard(env: NodeJS.ProcessEnv = {}) {
  return spawnSync("pnpm", ["tsx", scriptPath], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      ...env,
    },
    encoding: "utf8",
  });
}

describe("require-dev-env", () => {
  it("exits successfully when APP_ENV=development", () => {
    const result = runGuard({ APP_ENV: "development" });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("refuses when APP_ENV is unset", () => {
    const result = runGuard();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Refusing destructive operation.");
    expect(result.stderr).toContain("APP_ENV must be development or production");
  });

  it("refuses production without confirmation", () => {
    const result = runGuard({ APP_ENV: "production" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Refusing destructive operation against APP_ENV=production.");
    expect(result.stderr).toContain(`CONFIRM_PRODUCTION_RESET=${productionConfirmation}`);
  });

  it("allows production only with the exact confirmation token", () => {
    const wrongToken = runGuard({
      APP_ENV: "production",
      CONFIRM_PRODUCTION_RESET: "yes",
    });
    const exactToken = runGuard({
      APP_ENV: "production",
      CONFIRM_PRODUCTION_RESET: productionConfirmation,
    });

    expect(wrongToken.status).toBe(1);
    expect(exactToken.status).toBe(0);
    expect(exactToken.stderr).toContain("Production reset confirmation received.");
  });
});
