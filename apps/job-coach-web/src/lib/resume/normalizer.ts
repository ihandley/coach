import type { NormalizedResume, ResumeEducation, ResumeExperience } from "./types";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern =
  /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;

const knownSkills = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "SQL",
  "PostgreSQL",
  "Supabase",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST",
  "CI/CD",
];

function linesFromText(rawText: string) {
  return rawText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isHeading(line: string, heading: string) {
  return new RegExp(`^${heading}s?$`, "i").test(line.trim());
}

function sectionLines(lines: string[], heading: string) {
  const start = lines.findIndex((line) => isHeading(line, heading));

  if (start < 0) {
    return [];
  }

  const end = lines.findIndex(
    (line, index) =>
      index > start &&
      /^(experience|work experience|professional experience|education|skills|technical skills|projects|summary|certifications)$/i.test(
        line,
      ),
  );

  return lines.slice(start + 1, end < 0 ? undefined : end);
}

function extractName(lines: string[]) {
  const firstLikelyName = lines.find(
    (line) =>
      !emailPattern.test(line) &&
      !phonePattern.test(line) &&
      line.length <= 80 &&
      !/^(resume|curriculum vitae|summary|experience|skills|education)$/i.test(line),
  );

  return firstLikelyName ?? "";
}

function normalizeSkill(value: string) {
  return value.replace(/^[-•*]\s*/, "").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractSkills(rawText: string, lines: string[]) {
  const explicitSkillLines = [
    ...sectionLines(lines, "skills"),
    ...sectionLines(lines, "technical skills"),
  ];

  const explicitSkills = explicitSkillLines.flatMap((line) =>
    line
      .split(/[,|/;]+/)
      .map(normalizeSkill)
      .filter((skill) => skill.length > 1 && skill.length < 40),
  );

  const discoveredSkills = knownSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      rawText,
    ),
  );

  return unique([...explicitSkills, ...discoveredSkills]).slice(0, 40);
}

function buildExperience(lines: string[]) {
  const experienceLines = sectionLines(lines, "experience").length
    ? sectionLines(lines, "experience")
    : sectionLines(lines, "professional experience");

  if (experienceLines.length === 0) {
    return [] satisfies ResumeExperience[];
  }

  const bullets = experienceLines
    .filter((line) => /^[-•*]/.test(line))
    .map((line) => line.replace(/^[-•*]\s*/, ""));

  const firstRoleLine =
    experienceLines.find((line) => !/^[-•*]/.test(line) && line.length < 140) ?? "";
  const [title = firstRoleLine, company = ""] = firstRoleLine
    .split(/\s+(?:at|@|-|—)\s+/i)
    .map((part) => part.trim());

  if (!title && bullets.length === 0) {
    return [] satisfies ResumeExperience[];
  }

  return [
    {
      title,
      company,
      bullets,
    },
  ] satisfies ResumeExperience[];
}

function buildEducation(lines: string[]) {
  const educationLines = sectionLines(lines, "education");

  if (educationLines.length === 0) {
    return [] satisfies ResumeEducation[];
  }

  const firstLine = educationLines[0] ?? "";
  const [school = firstLine, degree] = firstLine
    .split(/\s+-\s+|\s+—\s+/)
    .map((part) => part.trim());

  return [
    {
      school,
      degree,
      details: educationLines.slice(1),
    },
  ] satisfies ResumeEducation[];
}

export function normalizeResumeText(rawText: string): NormalizedResume {
  const normalizedRawText = rawText.replace(/\r/g, "\n").trim();
  const lines = linesFromText(normalizedRawText);
  const email = normalizedRawText.match(emailPattern)?.[0] ?? "";
  const phone = normalizedRawText.match(phonePattern)?.[0];

  return {
    basics: {
      name: extractName(lines),
      email,
      ...(phone ? { phone } : {}),
    },
    skills: extractSkills(normalizedRawText, lines),
    experience: buildExperience(lines),
    education: buildEducation(lines),
    rawText: normalizedRawText,
  };
}
