import type {
  NormalizedResume,
  ResumeEducation,
  ResumeExperience,
  ResumeSkillGroup,
} from "./types";

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

const preferredSkillCategories = new Map(
  Object.entries({
    "node.js": "Tools",
    docker: "Tools",
    kubernetes: "Tools",
    sql: "Databases",
    postgresql: "Databases",
    supabase: "Databases",
    aws: "Cloud",
  }),
);

const sectionHeadingPattern =
  /^(experience|work experience|professional experience|education|skills|technical skills|core skills|projects|summary|professional summary|certifications)$/i;

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
      sectionHeadingPattern.test(line),
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
      !/^(resume|curriculum vitae|summary|professional summary|experience|skills|core skills|education)$/i.test(
        line,
      ),
  );

  return firstLikelyName ?? "";
}

function extractHeadline(lines: string[], name: string) {
  const firstSectionIndex = lines.findIndex((line) => sectionHeadingPattern.test(line));
  const headerLines = firstSectionIndex >= 0 ? lines.slice(0, firstSectionIndex) : lines;

  return (
    headerLines.find(
      (line) =>
        line !== name &&
        !emailPattern.test(line) &&
        !phonePattern.test(line) &&
        !sectionHeadingPattern.test(line) &&
        line.length <= 160,
    ) ?? ""
  );
}

function extractSummary(lines: string[]) {
  return sectionLinesForHeadings(lines, ["summary", "professional summary"]).join(" ");
}

function extractLinkedin(rawText: string) {
  return (
    rawText.match(
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Z0-9._%/-]+/i,
    )?.[0] ?? ""
  );
}

function extractLocation(lines: string[], email: string, phone?: string, linkedin?: string) {
  const contactLine = lines.find(
    (line) =>
      (email && line.includes(email)) ||
      (phone && line.includes(phone)) ||
      (linkedin && line.toLowerCase().includes("linkedin.com/in/")),
  );

  if (!contactLine) {
    return "";
  }

  const location = contactLine
    .split(/[•|]/)
    .map((part) => part.trim())
    .find(
      (part) =>
        part &&
        part !== email &&
        part !== phone &&
        !/linkedin\.com\/in\//i.test(part),
    );

  if (location) {
    return location;
  }

  return contactLine
    .replace(email, "")
    .replace(phone ?? "", "")
    .replace(linkedin ?? "", "")
    .replace(/[•|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSkill(value: string) {
  return value.replace(/^[-•*]\s*/, "").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function splitSkills(value: string) {
  return value
    .split(/[,|/;•]+/)
    .map(normalizeSkill)
    .filter((skill) => skill.length > 1 && skill.length < 60);
}

function pushSkillGroup(
  groups: Map<string, string[]>,
  category: string,
  skills: string[],
) {
  const normalizedCategory = category.trim() || "Skills";
  const existing = groups.get(normalizedCategory) ?? [];
  groups.set(normalizedCategory, unique([...existing, ...skills]));
}

function isFallbackSkillCategory(category: string) {
  return category.toLowerCase() === "skills";
}

function getPreferredSkillCategory(skill: string) {
  return preferredSkillCategories.get(skill.toLowerCase());
}

function skillCategoryRank(skill: string, category: string) {
  const preferredCategory = getPreferredSkillCategory(skill);

  if (!preferredCategory) {
    return 1;
  }

  return preferredCategory.toLowerCase() === category.toLowerCase() ? 0 : 2;
}

function globallyDedupSkillGroups(groups: Map<string, string[]>) {
  const categorizedGroups = Array.from(groups.entries()).filter(
    ([category]) => !isFallbackSkillCategory(category),
  );
  const fallbackGroups = Array.from(groups.entries()).filter(([category]) =>
    isFallbackSkillCategory(category),
  );
  const hasCategorizedSkills = categorizedGroups.some(([, items]) => items.length > 0);
  const orderedGroups = hasCategorizedSkills
    ? categorizedGroups
    : [...categorizedGroups, ...fallbackGroups];
  const selectedSkills = new Map<
    string,
    { category: string; item: string; rank: number }
  >();

  for (const [category, items] of orderedGroups) {
    for (const item of items) {
      const normalized = item.toLowerCase();
      const rank = skillCategoryRank(item, category);
      const selected = selectedSkills.get(normalized);

      if (!selected || rank < selected.rank) {
        selectedSkills.set(normalized, { category, item, rank });
      }
    }
  }

  return orderedGroups
    .map(([category]) => {
      const items = Array.from(selectedSkills.values())
        .filter((skill) => skill.category === category)
        .map((skill) => skill.item)
        .slice(0, 40);

      return { category, items };
    })
    .filter((group) => group.items.length > 0) satisfies ResumeSkillGroup[];
}

function extractSkills(rawText: string, lines: string[]) {
  const explicitSkillLines = [
    ...sectionLines(lines, "skills"),
    ...sectionLines(lines, "technical skills"),
    ...sectionLines(lines, "core skills"),
  ];

  const groups = new Map<string, string[]>();
  let currentCategory = "";

  for (const line of explicitSkillLines) {
    const segments = line.replace(/\s+¢\s+/g, " • ").split(/\s+•\s+/);

    for (const segment of segments) {
      const categoryMatch = segment.match(/^([^:]{2,40}):\s*(.+)?$/);

      if (categoryMatch) {
        currentCategory = categoryMatch[1]?.trim() ?? "Skills";
        pushSkillGroup(groups, currentCategory, splitSkills(categoryMatch[2] ?? ""));
        continue;
      }

      pushSkillGroup(groups, currentCategory || "Skills", splitSkills(segment));
    }
  }

  const discoveredSkills = knownSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      rawText,
    ),
  );
  const explicitSkillNames = new Set(
    Array.from(groups.values())
      .flat()
      .map((skill) => skill.toLowerCase()),
  );
  const newDiscoveredSkills = discoveredSkills.filter(
    (skill) => !explicitSkillNames.has(skill.toLowerCase()),
  );

  if (newDiscoveredSkills.length > 0) {
    pushSkillGroup(groups, "Skills", newDiscoveredSkills);
  }

  return globallyDedupSkillGroups(groups);
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
  const linkedin = extractLinkedin(normalizedRawText);
  const name = extractName(lines);
  const headline = extractHeadline(lines, name);
  const location = extractLocation(lines, email, phone, linkedin);
  const summary = extractSummary(lines);

  return {
    basics: {
      fullName: name,
      name,
      ...(headline ? { headline } : {}),
      email,
      ...(phone ? { phone } : {}),
      ...(location ? { location } : {}),
      ...(linkedin ? { linkedin } : {}),
      ...(summary ? { summary } : {}),
    },
    skills: extractSkills(normalizedRawText, lines),
    experience: buildExperience(lines),
    education: buildEducation(lines),
    rawText: normalizedRawText,
  };
}
