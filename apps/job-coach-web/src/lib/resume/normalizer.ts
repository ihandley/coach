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

function sectionLinesForHeadings(lines: string[], headings: string[]) {
  for (const heading of headings) {
    const section = sectionLines(lines, heading);

    if (section.length > 0) {
      return section;
    }
  }

  return [] as string[];
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

function splitDateRange(value?: string) {
  if (!value) {
    return {};
  }

  const compact = value.match(
    /^([A-Z][a-z]{2,8}\s+\d{4})\s+([A-Z][a-z]{2,8}\s+\d{4}|Present|Current)$/i,
  );

  if (compact) {
    return {
      startDate: compact[1]?.trim(),
      endDate: compact[2]?.trim(),
    };
  }

  const [startDate, endDate] = value
    .split(/\s+(?:-|–|—)\s+/)
    .map((part) => part.trim());

  return {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
}

function parseExperienceHeading(line: string) {
  const match = line.match(
    /^(.+?)\s+(?:—|–|-)\s+(.+?)(?:\s*\(([^)]+)\))?$/,
  );

  if (!match) {
    return null;
  }

  const [, company = "", title = "", dates] = match;

  return {
    company: company.trim(),
    title: title.trim(),
    ...splitDateRange(dates),
  };
}

function parseCompactExperienceHeading(line: string) {
  const match = line.match(
    /^(.+?)\s+((?:Senior|Staff|Principal|Lead|Software|System|Systems|Data|Backend|Frontend|Full Stack|Engineering|Developer|Manager|Director|Analyst|Engineer).+?)\s*\(([^)]+)\)$/,
  );

  if (!match) {
    return null;
  }

  const [, company = "", title = "", dates] = match;

  return {
    company: company.trim(),
    title: title.trim(),
    ...splitDateRange(dates),
  };
}

function parseAtExperienceHeading(line: string) {
  const [title, company] = line
    .split(/\s+(?:at|@)\s+/i)
    .map((part) => part.trim());

  if (!title || !company) {
    return null;
  }

  return {
    title,
    company,
  };
}

function buildExperience(lines: string[]) {
  const experienceLines = sectionLinesForHeadings(lines, [
    "professional experience",
    "work experience",
    "experience",
  ]);

  if (experienceLines.length === 0) {
    return [] satisfies ResumeExperience[];
  }

  const entries: ResumeExperience[] = [];
  let current: ResumeExperience | null = null;

  function pushCurrent() {
    if (current && (current.title || current.company || current.bullets.length)) {
      entries.push(current);
    }
  }

  for (const line of experienceLines) {
    const heading =
      parseExperienceHeading(line) ??
      parseCompactExperienceHeading(line) ??
      parseAtExperienceHeading(line);

    if (heading) {
      pushCurrent();
      current = {
        ...heading,
        bullets: [],
      };
      continue;
    }

    const bullet = line.match(/^[-•*]\s*(.+)$/)?.[1]?.trim();

    if (bullet) {
      if (!current) {
        current = {
          title: "",
          company: "",
          bullets: [],
        };
      }

      current.bullets.push(bullet);
      continue;
    }

    if (current?.bullets.length) {
      current.bullets[current.bullets.length - 1] = [
        current.bullets[current.bullets.length - 1],
        line,
      ].join(" ");
    }
  }

  pushCurrent();

  if (entries.length > 0) {
    return entries;
  }

  const firstRoleLine =
    experienceLines.find((line) => !/^[-•*]/.test(line) && line.length < 140) ?? "";
  const [title = firstRoleLine, company = ""] = firstRoleLine
    .split(/\s+(?:at|@)\s+/i)
    .map((part) => part.trim());

  return title || company
    ? [
        {
          title,
          company,
          bullets: experienceLines
            .filter((line) => /^[-•*]/.test(line))
            .map((line) => line.replace(/^[-•*]\s*/, "")),
        },
      ]
    : [];
}

function buildEducation(lines: string[]) {
  const educationLines = sectionLines(lines, "education");

  if (educationLines.length === 0) {
    return [] satisfies ResumeEducation[];
  }

  return educationLines
    .map((line) => {
      const explicitParts = line
        .split(/\s+(?:—|–|-)\s+/)
        .map((part) => part.trim());
      const compactMatch = line.match(
        /^(.+?)\s+((?:Bachelor|Bachelor's|Bachelor’s|Bachelor s|Associate|Master|Master's|Master’s|Doctor|PhD|B\.?S\.?|M\.?S\.?|A\.?A\.?|A\.?S\.?).*)$/,
      );
      const [school = line, credential] =
        explicitParts.length > 1
          ? explicitParts
          : compactMatch
            ? [compactMatch[1]?.trim() ?? line, compactMatch[2]?.trim()]
            : explicitParts;
      const [degree, field] = (credential ?? "")
        .split(/\s*,\s+/, 2)
        .map((part) => part.trim());

      return {
        school,
        ...(degree ? { degree } : {}),
        ...(field ? { field } : {}),
        details: [],
      };
    })
    .filter((entry) => entry.school) satisfies ResumeEducation[];
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
