const appEnv = process.env.APP_ENV;

if (appEnv !== "development") {
  console.error("");
  console.error("Refusing destructive operation.");
  console.error(`APP_ENV must be development, got: ${appEnv ?? "(unset)"}`);
  console.error("");
  process.exit(1);
}
