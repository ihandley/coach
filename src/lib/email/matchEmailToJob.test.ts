import { describe, expect, it } from "vitest";
import { matchEmailToJob } from "./matchEmailToJob";

const jobs = [
  {
    id: "job-1",
    company: "Torus",
    title: "Staff Software Engineer",
  },
  {
    id: "job-2",
    company: "Bloomlogic",
    title: "Founding Engineer",
  },
  {
    id: "job-3",
    company: "Remi",
    title: "Staff Software Engineer",
  },
];

describe("matchEmailToJob", () => {
  it("matches a strong company, sender domain, and title overlap", () => {
    const match = matchEmailToJob(
      {
        subject: "Torus Staff Software Engineer application update",
        from: "Recruiting <recruiting@torus.co>",
        body: "Thanks for applying to the Staff Software Engineer role at Torus.",
      },
      jobs,
    );

    expect(match).not.toBeNull();
    expect(match?.jobId).toBe("job-1");
    expect(match?.score).toBeGreaterThanOrEqual(0.5);
    expect(match?.signals).toContain("company");
    expect(match?.signals).toContain("title");
  });

  it("returns null when there is no meaningful overlap", () => {
    const match = matchEmailToJob(
      {
        subject: "Your grocery receipt",
        from: "Store <receipts@example.com>",
        body: "Thanks for shopping with us today.",
      },
      jobs,
    );

    expect(match).toBeNull();
  });

  it("can match ATS emails when the company and title are present", () => {
    const match = matchEmailToJob(
      {
        subject: "Bloomlogic Founding Engineer application received",
        from: "notifications@greenhouse.io",
        body: "We received your application for the Founding Engineer role at Bloomlogic.",
      },
      jobs,
    );

    expect(match).not.toBeNull();
    expect(match?.jobId).toBe("job-2");
    expect(match?.signals).toContain("ats");
    expect(match?.signals).toContain("company");
    expect(match?.signals).toContain("title");
  });

  it("does not match an ATS email without enough job-specific evidence", () => {
    const match = matchEmailToJob(
      {
        subject: "Application update",
        from: "notifications@greenhouse.io",
        body: "Thank you for your interest. We will be in touch soon.",
      },
      jobs,
    );

    expect(match).toBeNull();
  });

  it("chooses the best matching job when titles are similar", () => {
    const match = matchEmailToJob(
      {
        subject: "Remi Staff Software Engineer interview",
        from: "Recruiting <recruiting@remi.com>",
        body: "We would like to schedule your next interview for the Staff Software Engineer role at Remi.",
      },
      jobs,
    );

    expect(match).not.toBeNull();
    expect(match?.jobId).toBe("job-3");
    expect(match?.signals).toContain("company");
    expect(match?.signals).toContain("title");
  });

  it("normalizes punctuation and casing in company names", () => {
    const match = matchEmailToJob(
      {
        subject: "TORUS application status",
        from: "Recruiting <recruiting@example.com>",
        body: "Your application with Torus has been reviewed for the Staff Software Engineer position.",
      },
      [
        {
          id: "job-1",
          company: "Torus, Inc.",
          title: "Staff Software Engineer",
        },
      ],
    );

    expect(match).not.toBeNull();
    expect(match?.jobId).toBe("job-1");
  });
});
