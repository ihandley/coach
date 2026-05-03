import { describe, expect, it } from "vitest";
import { JOB_STATUSES } from "./types";
import { InMemoryJobRepository } from "./in-memory-job-repository";

import { JobTracker, InvalidJobStatusError, JobNotFoundError } from "./job-tracker";

describe("JOB_STATUSES", () => {
  it("defines the controlled job status vocabulary", () => {
    expect(JOB_STATUSES).toEqual([
      "saved",
      "researching",
      "applying",
      "applied",
      "interviewing",
      "offer",
      "rejected",
      "withdrawn",
      "archived",
    ]);
  });
});

describe("JobTracker.createJob", () => {
  it("creates a job with stable source data and default status", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    const job = await tracker.createJob({
      company: "Acme",
      title: "Senior Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original job posting snapshot",
      status: "saved",
    });

    expect(job.id).toBeDefined();
    expect(job.company).toBe("Acme");
    expect(job.title).toBe("Senior Software Engineer");
    expect(job.sourceUrl).toBe("https://example.com/jobs/123");
    expect(job.sourceText).toBe("Original job posting snapshot");
    expect(job.status).toBe("saved");
    expect(job.createdAt).toBeDefined();
    expect(job.updatedAt).toBeDefined();
  });

  it("rejects an invalid status", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    await expect(() =>
      tracker.createJob({
        company: "Acme",
        title: "Senior Software Engineer",
        sourceUrl: "https://example.com/jobs/123",
        sourceText: "Original job posting snapshot",
        status: "not-a-real-status" as never,
      }),
    ).rejects.toThrow(InvalidJobStatusError);
  });
});

describe("JobTracker.updateJobStatus", () => {
  it("updates the current status", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    const job = await tracker.createJob({
      company: "Acme",
      title: "Senior Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original job posting snapshot",
      status: "saved",
    });

    const updated = await tracker.updateJobStatus({
      jobId: job.id,
      status: "applied",
    });

    expect(updated.status).toBe("applied");
    expect(updated.updatedAt).not.toBe(job.updatedAt);
  });

  it("optionally appends a timeline event when status changes", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    const job = await tracker.createJob({
      company: "Acme",
      title: "Senior Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original job posting snapshot",
      status: "saved",
    });

    await tracker.updateJobStatus({
      jobId: job.id,
      status: "interviewing",
      event: {
        type: "status_changed",
        note: "Recruiter moved me to phone screen",
      },
    });

    const events = await tracker.listApplicationEvents(job.id);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      jobId: job.id,
      type: "status_changed",
      note: "Recruiter moved me to phone screen",
    });
  });

  it("rejects an invalid next status", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    const job = await tracker.createJob({
      company: "Acme",
      title: "Senior Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original job posting snapshot",
      status: "saved",
    });

    await expect(() =>
      tracker.updateJobStatus({
        jobId: job.id,
        status: "banana" as never,
      }),
    ).rejects.toThrow(InvalidJobStatusError);
  });
});

describe("JobTracker.addApplicationEvent", () => {
  it("appends explicit application history events", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    const job = await tracker.createJob({
      company: "Acme",
      title: "Senior Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original job posting snapshot",
      status: "applied",
    });

    const event = await tracker.addApplicationEvent({
      jobId: job.id,
      type: "note_added",
      note: "Followed up with hiring manager",
    });

    const events = await tracker.listApplicationEvents(job.id);

    expect(event.id).toBeDefined();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      jobId: job.id,
      type: "note_added",
      note: "Followed up with hiring manager",
    });
  });
});

describe("JobTracker.getDashboardSummary", () => {
  it("returns total tracked jobs and counts by status", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    await tracker.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Posting 1",
      status: "saved",
    });

    const appliedJob = await tracker.createJob({
      company: "Globex",
      title: "Frontend Engineer",
      sourceUrl: "https://example.com/jobs/2",
      sourceText: "Posting 2",
      status: "applied",
    });

    await tracker.createJob({
      company: "Initech",
      title: "Full Stack Engineer",
      sourceUrl: "https://example.com/jobs/3",
      sourceText: "Posting 3",
      status: "applied",
    });

    await tracker.updateJobStatus({
      jobId: appliedJob.id,
      status: "interviewing",
      event: {
        type: "status_changed",
        note: "Interview scheduled",
      },
    });

    const summary = await tracker.getDashboardSummary();

    expect(summary.totalTrackedJobs).toBe(3);
    expect(summary.countsByStatus).toEqual({
      saved: 1,
      researching: 0,
      applying: 0,
      applied: 1,
      interviewing: 1,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
      archived: 0,
    });

    expect(summary.recentlyUpdatedJobs).toHaveLength(3);
  });
});

describe("JobTracker.getJobById", () => {
  it("returns a single job by id", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    const job = await tracker.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Posting 1",
      status: "saved",
    });

    const found = await tracker.getJobById(job.id);

    expect(found).toEqual(job);
  });

  it("throws when the job does not exist", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    await expect(() => tracker.getJobById("missing-id")).rejects.toThrow(JobNotFoundError);
  });
});

describe("InMemoryJobRepository.findJobBySourceUrl", () => {
  it("returns an existing job when source URL matches exactly", async () => {
    const repository = new InMemoryJobRepository();

    const created = await repository.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Posting 1",
      status: "saved",
    });

    const found = await repository.findJobBySourceUrl("https://example.com/jobs/123");

    expect(found).toEqual(created);
  });

  it("returns null when no job exists for the source URL", async () => {
    const repository = new InMemoryJobRepository();

    const found = await repository.findJobBySourceUrl("https://example.com/jobs/missing");

    expect(found).toBeNull();
  });
});

describe("JobTracker.listJobs", () => {
  it("lists all jobs", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    await tracker.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Posting 1",
      status: "saved",
    });

    await tracker.createJob({
      company: "Globex",
      title: "Frontend Engineer",
      sourceUrl: "https://example.com/jobs/2",
      sourceText: "Posting 2",
      status: "applied",
    });

    const jobs = await tracker.listJobs();

    expect(jobs).toHaveLength(2);
  });

  it("filters jobs by status", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    await tracker.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Posting 1",
      status: "saved",
    });

    await tracker.createJob({
      company: "Globex",
      title: "Frontend Engineer",
      sourceUrl: "https://example.com/jobs/2",
      sourceText: "Posting 2",
      status: "applied",
    });

    const jobs = await tracker.listJobs({ status: "applied" });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.company).toBe("Globex");
  });

  it("filters jobs by keyword across company and title", async () => {
    const tracker = new JobTracker(new InMemoryJobRepository());

    await tracker.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Posting 1",
      status: "saved",
    });

    await tracker.createJob({
      company: "Globex",
      title: "Frontend Engineer",
      sourceUrl: "https://example.com/jobs/2",
      sourceText: "Posting 2",
      status: "applied",
    });

    const jobs = await tracker.listJobs({ keyword: "front" });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.company).toBe("Globex");
  });
});
