import type { NormalizedResume, TailoringSuggestion } from "@coach/core";

type TailoringJob = {
  title?: string | null;
  company?: string | null;
  sourceText?: string | null;
  structuredSummary?: unknown;
};

type SignalRule = {
  id: string;
  sectionTarget: string;
  jobTerms: string[];
  resumeTerms: string[];
  suggestedContent(input: {
    job: TailoringJob;
    resume: NormalizedResume;
  }): string;
  rationale: string;
  relatedJobRequirements: string[];
  priority: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
};

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return JSON.stringify(value).toLowerCase();
}

function resumeToText(resume: NormalizedResume): string {
  return normalizeText([
    resume.basics.fullName,
    resume.basics.headline,
    resume.basics.summary,
    resume.skills,
    resume.experience,
    resume.education,
  ]);
}

function jobToText(job: TailoringJob): string {
  return normalizeText([
    job.title,
    job.company,
    job.sourceText,
    job.structuredSummary,
  ]);
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

function getOriginalContent(
  resume: NormalizedResume,
  sectionTarget: string,
): string {
  if (sectionTarget === "summary") {
    return resume.basics.summary;
  }

  if (sectionTarget === "skills") {
    return resume.skills.join(", ");
  }

  const firstExperience = resume.experience[0];

  if (firstExperience) {
    return firstExperience.highlights.join(" ");
  }

  return resume.basics.summary;
}

const signalRules: SignalRule[] = [
  {
    id: "marketplace-integrations",
    sectionTarget: "summary",
    jobTerms: [
      "marketplace integrations",
      "marketplace apis",
      "ecommerce marketplaces",
      "amazon sp-api",
      "walmart marketplace apis",
    ],
    resumeTerms: ["marketplace", "ecommerce", "amazon sp-api", "walmart"],
    suggestedContent: ({ resume }) =>
      `${resume.basics.summary} Add one concise sentence connecting backend/API experience to high-volume ecommerce marketplace integrations.`,
    rationale:
      "Pattern emphasizes marketplace integrations and ecommerce acceleration, but the baseline resume does not name that domain.",
    relatedJobRequirements: [
      "marketplace integrations",
      "E-commerce or AdTech experience",
      "Amazon SP-API or Walmart Marketplace APIs",
    ],
    priority: "high",
    confidence: "high",
  },
  {
    id: "distributed-data-systems",
    sectionTarget: "experience",
    jobTerms: [
      "distributed backend systems",
      "massive data flows",
      "data-intensive",
      "core data pipeline",
      "66 trillion data points",
    ],
    resumeTerms: [
      "distributed",
      "massive data",
      "data-intensive",
      "data pipeline",
      "high-volume",
    ],
    suggestedContent: () =>
      "Add a quantified bullet showing ownership of a high-volume backend service, data pipeline, or distributed integration, including reliability or throughput impact.",
    rationale:
      "The job calls out distributed systems, massive data flows, and marketplace core stability; the resume currently shows backend ownership without that scale signal.",
    relatedJobRequirements: [
      "distributed backend systems",
      "massive data flows without downtime",
      "core data pipeline optimization",
    ],
    priority: "high",
    confidence: "high",
  },
  {
    id: "database-design-data-modeling",
    sectionTarget: "skills",
    jobTerms: ["database design", "data modeling"],
    resumeTerms: ["database design", "data modeling"],
    suggestedContent: ({ resume }) =>
      `${resume.skills.join(", ")}, database design, data modeling`,
    rationale:
      "The baseline skills mention PostgreSQL but do not mirror the database design and data modeling language in the posting.",
    relatedJobRequirements: ["database design", "data modeling"],
    priority: "medium",
    confidence: "high",
  },
  {
    id: "partner-product-language",
    sectionTarget: "experience",
    jobTerms: [
      "partner success",
      "partner obsessed",
      "product managers",
      "program managers",
      "customer requirements",
    ],
    resumeTerms: [
      "partner success",
      "partner obsessed",
      "customer requirements",
      "global partners",
    ],
    suggestedContent: () =>
      "Revise one collaboration bullet to show how product, program, or business partner input shaped the technical plan and measurable outcome.",
    rationale:
      "Pattern uses partner/product language heavily; the resume has collaboration evidence but does not yet frame it in the posting's terms.",
    relatedJobRequirements: [
      "collaborate cross-functionally",
      "partner needs",
      "product and program management",
    ],
    priority: "medium",
    confidence: "medium",
  },
  {
    id: "technical-leadership",
    sectionTarget: "experience",
    jobTerms: [
      "lead software engineers",
      "technical leadership",
      "mentor",
      "architectural excellence",
    ],
    resumeTerms: ["led", "lead", "mentor", "mentored", "technical leadership"],
    suggestedContent: () =>
      "Strengthen leadership bullets with scope: number of engineers mentored, architecture decisions owned, and delivery outcomes.",
    rationale:
      "The role is staff-level and leadership-heavy; the resume has leadership overlap but should make scope and outcomes explicit.",
    relatedJobRequirements: [
      "lead software engineers",
      "mentor engineers",
      "architectural excellence",
    ],
    priority: "low",
    confidence: "medium",
  },
];

export function generateResumeTailoringSuggestions(input: {
  job: TailoringJob;
  sourceResume: NormalizedResume;
}): TailoringSuggestion[] {
  const jobText = jobToText(input.job);
  const resumeText = resumeToText(input.sourceResume);

  return signalRules
    .filter((rule) => includesAny(jobText, rule.jobTerms))
    .filter((rule) => !includesAny(resumeText, rule.resumeTerms))
    .map((rule) => ({
      id: `suggestion-${rule.id}`,
      sectionTarget: rule.sectionTarget,
      originalContent: getOriginalContent(input.sourceResume, rule.sectionTarget),
      suggestedContent: rule.suggestedContent({
        job: input.job,
        resume: input.sourceResume,
      }),
      rationale: rule.rationale,
      relatedJobRequirements: rule.relatedJobRequirements,
      priority: rule.priority,
      confidence: rule.confidence,
    }));
}
