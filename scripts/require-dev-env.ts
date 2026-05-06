const PRODUCTION_CONFIRMATION = "RESET_PRODUCTION_JOB_COACH_DATA";

type AppEnv = "development" | "production";

function getAppEnv(): AppEnv {
  const appEnv = process.env.APP_ENV;

  if (appEnv !== "development" && appEnv !== "production") {
    console.error("");
    console.error("Refusing destructive operation.");
    console.error(`APP_ENV must be development or production, got: ${appEnv ?? "(unset)"}`);
    console.error("");
    process.exit(1);
  }

  return appEnv;
}

const appEnv = getAppEnv();

if (appEnv === "development") {
  process.exit(0);
}

if (process.env.CONFIRM_PRODUCTION_RESET === PRODUCTION_CONFIRMATION) {
  console.error("");
  console.error("Production reset confirmation received.");
  console.error("Continuing with destructive operation against APP_ENV=production.");
  console.error("");
  process.exit(0);
}

console.error("");
console.error("Refusing destructive operation against APP_ENV=production.");
console.error("This environment is for stable personal Job Coach data.");
console.error("");
console.error("To continue anyway, set:");
console.error(`CONFIRM_PRODUCTION_RESET=${PRODUCTION_CONFIRMATION}`);
console.error("");
process.exit(1);
