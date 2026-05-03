import { loadEnvFromKeychain } from "../env/load-env";
import { createDbJobImporter } from "./create-db-job-importer";
import { fetchJobPageAsDependency, extractJobStub } from "@coach/ai";

async function main() {
  loadEnvFromKeychain();

  const importer = createDbJobImporter({
    fetchPage: fetchJobPageAsDependency,
    extractJob: extractJobStub,
  });

  const url = process.argv[2];

  if (!url) {
    throw new Error("Usage: pnpm tsx packages/db/src/jobs/manual-import-smoke.ts <job-url>");
  }

  const result = await importer.importJobFromUrl(url);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
