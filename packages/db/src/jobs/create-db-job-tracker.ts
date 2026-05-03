import { JobTracker } from "@coach/core";
import { DbJobRepository } from "./db-job-repository";
import { createServerClient } from "../supabase/create-server-client";
import { loadEnvFromKeychain } from "../env/load-env";

export function createDbJobTracker() {
  if (process.env.NODE_ENV !== "test" && process.env.PLAYWRIGHT !== "1") {
    loadEnvFromKeychain();
  }

  return new JobTracker(new DbJobRepository(createServerClient()));
}
