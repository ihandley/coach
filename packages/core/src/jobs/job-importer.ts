export type FetchedJobPage = {
  url: string;
  html: string;
};

export type ExtractedJobData = {
  company: string;
  title: string;
  rawDescription: string;
} & Record<string, unknown>;

export type SavedImportedJob = {
  id: string;
  company: string;
  title: string;
  rawDescription: string;
} & Record<string, unknown>;

type FindImportedJobBySourceUrl = (
  url: string,
) => Promise<SavedImportedJob | null>;

type FetchPage = (url: string) => Promise<FetchedJobPage>;
type ExtractJob = (input: FetchedJobPage) => Promise<unknown>;
type SaveImportedJob = (
  input: ExtractedJobData,
) => Promise<SavedImportedJob>;

export class InvalidJobImportUrlError extends Error {
  constructor(url: string) {
    super(`Invalid job import URL: ${url}`);
    this.name = "InvalidJobImportUrlError";
  }
}

export class InvalidExtractedJobDataError extends Error {
  constructor() {
    super("Invalid extracted job data");
    this.name = "InvalidExtractedJobDataError";
  }
}

export type JobImporterDependencies = {
  findImportedJobBySourceUrl: FindImportedJobBySourceUrl;
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

    const existing = await this.dependencies.findImportedJobBySourceUrl(url);

    if (existing) {
      return existing;
    }

    const page = await this.dependencies.fetchPage(url);
    const extracted = await this.dependencies.extractJob(page);
    const validated = validateExtractedJobData(extracted);

    return this.dependencies.saveImportedJob(validated);
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

function validateExtractedJobData(value: unknown): ExtractedJobData {
  if (!value || typeof value !== "object") {
    throw new InvalidExtractedJobDataError();
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.company !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.rawDescription !== "string"
  ) {
    throw new InvalidExtractedJobDataError();
  }

  return candidate as ExtractedJobData;
}