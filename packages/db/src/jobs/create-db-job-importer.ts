import {
    RepositoryBackedJobImporter,
    type ExtractJob,
    type FetchPage,
} from "@coach/core";
import { createServerClient } from "../supabase/create-server-client.ts";
import { DbJobRepository } from "./db-job-repository.ts";

export function createDbJobImporter(dependencies: {
    fetchPage: FetchPage;
    extractJob: ExtractJob;
}) {
    return new RepositoryBackedJobImporter({
        repository: new DbJobRepository(createServerClient()),
        fetchPage: dependencies.fetchPage,
        extractJob: dependencies.extractJob,
    });
}