import { beforeEach, describe, expect, it } from "vitest";
import { DbJobRepository } from "./db-job-repository";
import { createServerClient } from "../supabase/create-server-client";
import { loadEnvFromKeychain } from "../env/load-env";

loadEnvFromKeychain();

const hasSupabaseEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const describeIntegration = hasSupabaseEnv ? describe : describe.skip;

describeIntegration("DbJobRepository", () => {
  const createRepo = () => new DbJobRepository(createServerClient());

  beforeEach(async () => {
    const supabase = createServerClient();

    const { error: eventsError } = await supabase
      .from("application_events")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (eventsError) throw eventsError;

    const { error: jobsError } = await supabase
      .from("jobs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (jobsError) throw jobsError;
  });

  it("creates and fetches a job", async () => {
    const repo = createRepo();

    const created = await repo.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Example posting",
      status: "saved",
    });

    const found = await repo.getJobById(created.id);

    expect(found).toEqual(created);
  });

  it("lists jobs ordered by updatedAt desc", async () => {
    const repo = createRepo();

    await repo.createJob({
      company: "First Co",
      title: "Engineer I",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "First",
      status: "saved",
    });

    await repo.createJob({
      company: "Second Co",
      title: "Engineer II",
      sourceUrl: "https://example.com/jobs/2",
      sourceText: "Second",
      status: "applied",
    });

    const jobs = await repo.listJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs[0]?.company).toBe("Second Co");
    expect(jobs[1]?.company).toBe("First Co");
  });

  it("adds and lists application events", async () => {
    const repo = createRepo();

    const created = await repo.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/1",
      sourceText: "Example posting",
      status: "saved",
    });

    const event = await repo.addApplicationEvent({
      jobId: created.id,
      type: "note_added",
      note: "Reached out to recruiter",
    });

    const events = await repo.listApplicationEvents(created.id);

    expect(event.id).toBeDefined();
    expect(events).toHaveLength(1);
    expect(events[0]?.note).toBe("Reached out to recruiter");
  });

  it("finds a job by source URL", async () => {
    const repo = createRepo();

    const created = await repo.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original posting snapshot",
      status: "saved",
    });

    const found = await repo.findJobBySourceUrl(
      "https://example.com/jobs/123",
    );

    expect(found).toEqual(created);
  });

  it("returns null when no job exists for the source URL", async () => {
    const repo = createRepo();

    const found = await repo.findJobBySourceUrl(
      "https://example.com/jobs/missing",
    );

    expect(found).toBeNull();
  });
});