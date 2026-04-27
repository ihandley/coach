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

    const resolvedUrl = await resolveCanonicalUrl(url, html);

    if (resolvedUrl !== url) {
        const response2 = await dependencies.fetch(resolvedUrl);

        if (response2.ok) {
            const html2 = await response2.text();
            return {
                url: resolvedUrl,
                html: html2,
            };
        }
    }

    return {
        url,
        html,
    };
}

export const fetchJobPageAsDependency: FetchPage = async (
    url: string,
): Promise<FetchedJobPage> => {
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

function extractApplyUrlFromLinkedIn(html: string): string | null {
    const match = html.match(/href="(https:\/\/[^"]+)"[^>]*>\s*Apply/i);
    if (match) return decodeURIComponent(match[1]);

    const alt = html.match(/"applyUrl":"([^"]+)"/);
    if (alt) return decodeURIComponent(alt[1]);

    return null;
}

function isLinkedIn(url: string): boolean {
    return url.includes("linkedin.com");
}

async function resolveCanonicalUrl(
    url: string,
    html: string,
): Promise<string> {
    if (!isLinkedIn(url)) return url;

    const applyUrl = extractApplyUrlFromLinkedIn(html);
    return applyUrl || url;
}
