import type { ExtractedJobData, FetchedJobPage } from "@coach/core";
import { extractJobWithLLM } from "./extract-job-llm";

export class ExtractJobDataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ExtractJobDataError";
    }
}


export const extractJobStub = async (
  input: FetchedJobPage,
): Promise<ExtractedJobData> => {
  try {
    const llm = await extractJobWithLLM(input);

    if (llm) {
      console.log("🧠 LLM extraction succeeded");
      return llm;
    }
  } catch (err) {
    console.warn("⚠️ LLM extraction failed, falling back", err);
  }

  console.log("⚠️ Falling back to stub extraction");

  // fallback (your existing logic)
  const html = input.html;

  let title =
    extractOgMeta(html, "og:title") ??
    extractTitleFromH1(html) ??
    "Unknown";

  title = cleanTitle(title);

  let company =
    extractCompanyFromGreenhouseBackLink(html) ??
    extractOgMeta(html, "og:site_name") ??
    extractCompanyFromTitle(title) ??
    "Unknown";

  company = cleanCompany(company);

  const rawDescription =
    extractMainContent(html) ??
    stripHtmlToText(html);

  return {
    company,
    title,
    rawDescription,
  };
};


function cleanTitle(title: string): string {
    return title
        .replace(/\|\s*LinkedIn.*$/i, "")
        .replace(/\|\s*Glassdoor.*$/i, "")
        .replace(/-+\s*Job.*$/i, "")
        .replace(/\s*\(.*?\)\s*$/, "")
        .trim();
}

function cleanCompany(company: string): string {
    return company
        .replace(/\|\s*LinkedIn.*$/i, "")
        .replace(/\s+Jobs?$/i, "")
        .trim();
}

function extractCompanyFromTitle(title: string): string | null {
    const parts = title.split(" at ");
    if (parts.length === 2) {
        return parts[1].trim();
    }

    const dashParts = title.split(" - ");
    if (dashParts.length === 2) {
        return dashParts[1].trim();
    }

    return null;
}

function extractOgMeta(html: string, property: string): string | null {
    const escaped = escapeRegExp(property);
    const regex = new RegExp(
        `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
        "i",
    );

    return decodeHtml(regex.exec(html)?.[1] ?? "").trim() || null;
}

function extractTitleFromH1(html: string): string | null {
    const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return decodeHtml(stripHtml(match?.[1] ?? "")).trim() || null;
}

function extractCompanyFromGreenhouseBackLink(html: string): string | null {
    const logoAltMatch = html.match(/alt="([^"]+)\s+Logo"/i);
    return decodeHtml(logoAltMatch?.[1] ?? "").trim() || null;
}

function extractJobDescriptionText(html: string): string | null {
    const match = html.match(
        /<div class="job__description body"><div>([\s\S]*?)<\/div><\/div>/i,
    );

    if (!match) return null;

    return normalizeWhitespace(decodeHtml(stripHtml(match[1]))).trim() || null;
}

function stripHtmlToText(html: string): string {
    return normalizeWhitespace(decodeHtml(stripHtml(html))).trim();
}

function stripHtml(value: string): string {
    return value
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|ul|ol|br)>/gi, "\n")
        .replace(/<li[^>]*>/gi, "- ")
        .replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string): string {
    return value
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function normalizeWhitespace(value: string): string {
    return value
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n");
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function extractMainContent(html: string): string | null {
    const patterns = [
        /<section[^>]+class="[^"]*(description|job|posting)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
        /<div[^>]+class="[^"]*(description|job|posting)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[2] || match?.[1]) {
            const content = match[2] || match[1];
            const cleaned = normalizeWhitespace(decodeHtml(stripHtml(content))).trim();
            if (cleaned.length > 200) return cleaned;
        }
    }

    return null;
}
