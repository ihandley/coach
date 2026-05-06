import { describe, expect, it } from "vitest";

import { normalizeResumeSkillGroups, normalizeResumeText } from "./normalizer";

const ianResumeExtractedText = `Ian Handley
Senior Software Engineer — Go, Distributed Systems, Cloud (AWS/GCP) — Open to Remote
Spanish Fork, UT • ianhandley@gmail.com • (605) 415-2577 • linkedin.com/in/ianrhandley
SUMMARY
Senior Software Engineer with 20+ years building and owning backend systems and distributed architectures.
CORE SKILLS
Languages: Go, C#, JavaScript, Python • Systems: Distributed Systems, Microservices, Messaging • Cloud:
AWS, GCP, Azure
PROFESSIONAL EXPERIENCE
Equifax — Senior Software Engineer (Jan 2023 – Apr 2026)
• Owned Go-based backend services supporting high-volume chargeback systems (~millions of
transactions/month)
• Designed distributed systems across AWS and GCP improving system reliability and reducing incident
frequency
Optilogic — Senior Software Engineer (Sep 2022 – Nov 2022)
• Developed microservices and APIs supporting supply chain optimization platforms
• Designed containerized services (Docker/Kubernetes) improving deployment consistency
Nu Skin — Senior Software Engineer (Aug 2019 – Aug 2022)
• Maintained messaging platform processing large-scale business-critical transactions
• Re-architected validation systems using AWS improving scalability and reliability
ActiveCare — System Engineer (May 2013 – Aug 2019)
• Architected big-data platform processing millions of insurance claims for healthcare insights
• Designed ETL pipelines (R, Talend, SSIS) enabling large-scale data processing
United States Air Force — Data Integrity Analyst (Jul 2008 – Oct 2011)
• Improved aircraft maintenance data accuracy through system-wide data integrity initiatives
• Automated reporting workflows using VBA and Excel under constrained environments
Computer Research, Inc. — Software Engineer (Jan 2002 – Aug 2005)
• Built financial systems supporting trading platforms using SQL Server
• Developed internal web applications and tools improving team productivity
EDUCATION
University of Colorado, Denver — Bachelor’s Degree, Sociology
Community College of the Air Force — Associate of Applied Science, Avionics`;

describe("normalizeResumeText", () => {
  it("always returns a valid structured resume", () => {
    const result = normalizeResumeText(`Ian Handley
ian@example.com
(555) 123-4567

Skills
TypeScript, React, SQL

Experience
Senior Engineer at Acme
- Built hiring tools

Education
University of Utah - BS Computer Science`);

    expect(result).toEqual({
      basics: {
        fullName: "Ian Handley",
        name: "Ian Handley",
        email: "ian@example.com",
        phone: "(555) 123-4567",
      },
      skills: [
        {
          category: "Skills",
          items: expect.arrayContaining(["TypeScript", "React"]),
        },
        {
          category: "Databases",
          items: ["SQL"],
        },
      ],
      experience: [
        {
          title: "Senior Engineer",
          company: "Acme",
          bullets: ["Built hiring tools"],
        },
      ],
      education: [
        {
          school: "University of Utah",
          degree: "BS Computer Science",
          details: [],
        },
      ],
      rawText: expect.stringContaining("Ian Handley"),
    });
  });

  it("returns empty arrays and string fields when text has no sections", () => {
    expect(normalizeResumeText("")).toEqual({
      basics: {
        fullName: "",
        name: "",
        email: "",
      },
      skills: [],
      experience: [],
      education: [],
      rawText: "",
    });
  });

  it("keeps each extracted resume company and school as separate entries", () => {
    const result = normalizeResumeText(ianResumeExtractedText);

    expect(result.basics).toMatchObject({
      fullName: "Ian Handley",
      name: "Ian Handley",
      headline:
        "Senior Software Engineer — Go, Distributed Systems, Cloud (AWS/GCP) — Open to Remote",
      email: "ianhandley@gmail.com",
      phone: "(605) 415-2577",
      location: "Spanish Fork, UT",
      linkedin: "linkedin.com/in/ianrhandley",
      summary:
        "Senior Software Engineer with 20+ years building and owning backend systems and distributed architectures.",
    });
    expect(result.experience).toHaveLength(6);
    expect(result.education).toHaveLength(2);
    expect(result.skills).toEqual(
      expect.arrayContaining([
        {
          category: "Languages",
          items: expect.arrayContaining(["Go", "C#", "JavaScript", "Python"]),
        },
        {
          category: "Systems",
          items: expect.arrayContaining(["Distributed Systems", "Microservices", "Messaging"]),
        },
        {
          category: "Cloud",
          items: expect.arrayContaining(["AWS", "GCP", "Azure"]),
        },
      ]),
    );
    expect(result.experience).toMatchObject([
      {
        company: "Equifax",
        title: "Senior Software Engineer",
        startDate: "Jan 2023",
        endDate: "Apr 2026",
      },
      {
        company: "Optilogic",
        title: "Senior Software Engineer",
        startDate: "Sep 2022",
        endDate: "Nov 2022",
      },
      {
        company: "Nu Skin",
        title: "Senior Software Engineer",
        startDate: "Aug 2019",
        endDate: "Aug 2022",
      },
      {
        company: "ActiveCare",
        title: "System Engineer",
        startDate: "May 2013",
        endDate: "Aug 2019",
      },
      {
        company: "United States Air Force",
        title: "Data Integrity Analyst",
        startDate: "Jul 2008",
        endDate: "Oct 2011",
      },
      {
        company: "Computer Research, Inc.",
        title: "Software Engineer",
        startDate: "Jan 2002",
        endDate: "Aug 2005",
      },
    ]);
    expect(result.experience[0]?.bullets).toEqual([
      "Owned Go-based backend services supporting high-volume chargeback systems (~millions of transactions/month)",
      "Designed distributed systems across AWS and GCP improving system reliability and reducing incident frequency",
    ]);
    expect(result.experience[1]?.bullets).toEqual([
      "Developed microservices and APIs supporting supply chain optimization platforms",
      "Designed containerized services (Docker/Kubernetes) improving deployment consistency",
    ]);
    const bulletCount = result.experience.reduce((count, entry) => count + entry.bullets.length, 0);
    expect(bulletCount).toBe(12);
    expect(result.education).toMatchObject([
      {
        school: "University of Colorado, Denver",
        degree: "Bachelor’s Degree",
        field: "Sociology",
      },
      {
        school: "Community College of the Air Force",
        degree: "Associate of Applied Science",
        field: "Avionics",
      },
    ]);
  });

  it("deduplicates skill strings globally and prefers categorized groups", () => {
    const result = normalizeResumeText(`Ian Handley
ian@example.com

Core Skills
Languages: TypeScript, Node.js, SQL
Databases: SQL, PostgreSQL
Tools: Node.js, Docker

Experience
Engineer at Acme
- Built services with Node.js and SQL`);

    const skillStrings = result.skills.flatMap((group) => group.items);
    const normalizedSkillStrings = skillStrings.map((skill) => skill.toLowerCase());

    expect(normalizedSkillStrings).toHaveLength(new Set(normalizedSkillStrings).size);
    expect(result.skills.map((group) => group.category)).not.toContain("Skills");
    expect(result.skills).toEqual(
      expect.arrayContaining([
        {
          category: "Languages",
          items: ["TypeScript"],
        },
        {
          category: "Databases",
          items: ["SQL", "PostgreSQL"],
        },
        {
          category: "Tools",
          items: ["Node.js", "Docker"],
        },
      ]),
    );
  });

  it("normalizes parsed skill groups before imported resume output is persisted", () => {
    expect(
      normalizeResumeSkillGroups([
        { category: "Languages", items: ["TypeScript", "Node.js", "SQL"] },
        { category: "Skills", items: ["TypeScript", "Docker"] },
      ]),
    ).toEqual([
      {
        category: "Languages",
        items: ["TypeScript"],
      },
      {
        category: "Tools",
        items: ["Node.js"],
      },
      {
        category: "Databases",
        items: ["SQL"],
      },
    ]);
  });
});
