import { cleanJobText, extractJobFields } from "@coach/core";
import type { ExtractedJobData, FetchedJobPage } from "@coach/core";

export class ExtractJobDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractJobDataError";
  }
}

export const extractJobStub = async (input: FetchedJobPage): Promise<ExtractedJobData> => {
  const html = input.html;

  const titleCandidate = extractOgMeta(html, "og:title") ?? extractTitleFromH1(html) ?? "";

  const companyCandidate =
    extractCompanyFromGreenhouseBackLink(html) ?? extractOgMeta(html, "og:site_name") ?? "";

  const rawDescription = cleanJobText(
    extractLinkedInDescriptionText(html) ??
      extractJobDescriptionText(html) ??
      stripHtmlToText(html),
  );

  if (!rawDescription || rawDescription.trim().length === 0) {
    throw new ExtractJobDataError("Could not extract job description text");
  }

  const fields = extractJobFields(
    [titleCandidate, usefulCompanyCandidate(companyCandidate)].filter(Boolean).join("\n"),
  );

  const title = titleCandidate ? fields.title : "Unknown";
  const company = titleCandidate
    ? fields.company
    : usefulCompanyCandidate(companyCandidate) || "Unknown";
  const location = extractOgMeta(html, "og:description") ?? undefined;

  return {
    company,
    title,
    rawDescription,
    ...(location ? { location } : {}),
  };
};

function usefulCompanyCandidate(company: string): string {
  return company.trim().toLowerCase() === "linkedin" ? "" : company;
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
  const match = html.match(/Back to jobs<\/a>[\s\S]*?<div class="job__tags"/i);
  if (!match) {
    const logoAltMatch = html.match(/alt="([^"]+)\s+Logo"/i);
    return decodeHtml(logoAltMatch?.[1] ?? "").trim() || null;
  }

  const logoAltMatch = html.match(/alt="([^"]+)\s+Logo"/i);
  return decodeHtml(logoAltMatch?.[1] ?? "").trim() || null;
}

function extractJobDescriptionText(html: string): string | null {
  const match = html.match(/<div class="job__description body"><div>([\s\S]*?)<\/div><\/div>/i);

  if (!match) {
    return null;
  }

  return normalizeWhitespace(decodeHtml(stripHtml(match[1]))).trim() || null;
}

function extractLinkedInDescriptionText(html: string): string | null {
  const match = html.match(
    /<div[^>]+class=["'][^"']*(?:show-more-less-html__markup|jobs-description-content__text|description__text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  );

  if (!match) {
    return null;
  }

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
