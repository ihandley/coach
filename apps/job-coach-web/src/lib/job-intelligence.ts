export type JobIntelligence = {
  sections: Record<string, string[]>;
  easterEggs: string[];
  flags: {
    hasSalary: boolean;
    hasRequirements: boolean;
    hasBenefits: boolean;
    hasEasterEggs: boolean;
  };
};

export function parseJobIntelligence(text: string): JobIntelligence {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const sections: Record<string, string[]> = {
    about: [],
    responsibilities: [],
    requirements: [],
    salary: [],
    location: [],
    benefits: [],
    application: [],
  };

  const easterEggs: string[] = [];

  const patterns = {
    requirements: /requirements|qualifications|must have|experience/i,
    responsibilities: /responsibilities|what you'll do|day to day/i,
    salary: /salary|compensation|pay|equity/i,
    location: /location|remote|hybrid|onsite/i,
    benefits: /benefits|perks|health|pto|401k/i,
    application: /apply|application|cover letter|resume/i,
    easterEgg: /include|attention|do not use ai|no ai|chatgpt|purple squirrel/i,
  };

  let current: keyof typeof sections = "about";

  for (const line of lines) {
    if (patterns.easterEgg.test(line)) easterEggs.push(line);

    if (patterns.requirements.test(line)) current = "requirements";
    else if (patterns.responsibilities.test(line)) current = "responsibilities";
    else if (patterns.salary.test(line)) current = "salary";
    else if (patterns.location.test(line)) current = "location";
    else if (patterns.benefits.test(line)) current = "benefits";
    else if (patterns.application.test(line)) current = "application";

    sections[current].push(line);
  }

  return {
    sections,
    easterEggs,
    flags: {
      hasSalary: sections.salary.length > 0,
      hasRequirements: sections.requirements.length > 0,
      hasBenefits: sections.benefits.length > 0,
      hasEasterEggs: easterEggs.length > 0,
    },
  };
}
