import { JobTracker } from "@coach/core";
import { DbJobRepository } from "./db-job-repository.ts";
import { createServerClient } from "../supabase/create-server-client.ts";
import { loadEnvFromKeychain } from "../env/load-env.ts";

export function createDbJobTracker() {
  loadEnvFromKeychain();
  return new JobTracker(new DbJobRepository(createServerClient()));
}