import { JobTracker } from "@coach/core";
import { DbJobRepository } from "./db-job-repository";
import { createServerClient } from "../supabase/create-server-client";
import { loadEnvFromKeychain } from "../env/load-env";

export function createDbJobTracker() {
  loadEnvFromKeychain();
  return new JobTracker(new DbJobRepository(createServerClient()));
}