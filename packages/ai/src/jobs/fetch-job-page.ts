import type { FetchPage, FetchedJobPage } from "@coach/core";

type FetchResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

type FetchLike = (url: string) => Promise<FetchResponse>;

export class FetchJobPageError extends Error {
  constructor(url: string, status: number) {
    super(`Failed to fetch job page: ${url} (${status})`);
    this.name = "FetchJobPageError";
  }
}

export async function fetchJobPage(
  url: string,
  dependencies: { fetch: FetchLike },
): Promise<FetchedJobPage> {
  const response = await dependencies.fetch(url);

  if (!response.ok) {
    throw new FetchJobPageError(url, response.status);
  }

  const html = await response.text();

  return {
    url,
    html,
  };
}

export const fetchJobPageAsDependency: FetchPage = async (url: string): Promise<FetchedJobPage> => {
  return fetchJobPage(url, {
    fetch: async (input: string) => {
      const response = await fetch(input);

      return {
        ok: response.ok,
        status: response.status,
        text: async () => response.text(),
      };
    },
  });
};
