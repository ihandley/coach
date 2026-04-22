type FetchPage = (url: string) => Promise<unknown>;
type ExtractJob = (input: unknown) => Promise<unknown>;
type SaveImportedJob = (input: unknown) => Promise<unknown>;

export class InvalidJobImportUrlError extends Error {
  constructor(url: string) {
    super(`Invalid job import URL: ${url}`);
    this.name = "InvalidJobImportUrlError";
  }
}

export type JobImporterDependencies = {
  fetchPage: FetchPage;
  extractJob: ExtractJob;
  saveImportedJob: SaveImportedJob;
};

export class JobImporter {
  constructor(private readonly dependencies: JobImporterDependencies) {}

  async importJobFromUrl(url: string): Promise<unknown> {
    if (!isValidHttpUrl(url)) {
      throw new InvalidJobImportUrlError(url);
    }

    const page = await this.dependencies.fetchPage(url);
    const extracted = await this.dependencies.extractJob(page);
    return this.dependencies.saveImportedJob(extracted);
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}