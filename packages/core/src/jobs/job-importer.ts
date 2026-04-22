export type FetchedJobPage = {
  url: string;
  html: string;
};

export type ExtractedJobData = {
  company: string;
  title: string;
  rawDescription: string;
};

export type SavedImportedJob = {
  id: string;
  company: string;
  title: string;
  rawDescription: string;
};

type FetchPage = (url: string) => Promise<FetchedJobPage>;
type ExtractJob = (input: FetchedJobPage) => Promise<ExtractedJobData>;
type SaveImportedJob = (
  input: ExtractedJobData,
) => Promise<SavedImportedJob>;

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

  async importJobFromUrl(url: string): Promise<SavedImportedJob> {
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