import { RepositoryBackedJobImporter } from "@coach/core";
import { createServerClient } from "../supabase/create-server-client";
import { DbJobRepository } from "./db-job-repository";

type FetchPage = (url: string) => Promise<{
    url: string;
    html: string;
}>;

type ExtractJob = (input: { url: string; html: string }) => Promise<{
    company: string;
    title: string;
    rawDescription: string;
} & Record<string, unknown>>;

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