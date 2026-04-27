import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRepository } from "@coach/core";
import type {
  AddApplicationEventInput,
  ApplicationEventRecord,
  CreateJobInput,
  JobRecord,
  ListJobsInput,
  UpdateJobStatusInput,
} from "@coach/core";
import { mapJobRow } from "./map-job-row";

export class DbJobRepository implements JobRepository {
  constructor(private readonly supabase: SupabaseClient) { }

  async createJob(input: CreateJobInput): Promise<JobRecord> {
    const { data, error } = await this.supabase
      .from("jobs")
      .insert({
        company: input.company,
        title: input.title,
        source_url: input.sourceUrl,
        source_text: input.sourceText,
        status: input.status || "saved",
      })
      .select(`
        id,
        company,
        title,
        source_url,
        source_text,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    return mapJobRow(data);
  }

  async getJobById(jobId: string): Promise<JobRecord | null> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select(`
        id,
        company,
        title,
        source_url,
        source_text,
        status,
        created_at,
        updated_at
      `)
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapJobRow(data);
  }

  async findJobBySourceUrl(sourceUrl: string): Promise<JobRecord | null> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select(`
        id,
        company,
        title,
        source_url,
        source_text,
        status,
        created_at,
        updated_at
      `)
      .eq("source_url", sourceUrl)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapJobRow(data);
  }

  async listJobs(input?: ListJobsInput): Promise<JobRecord[]> {
    let query = this.supabase
      .from("jobs")
      .select(`
        id,
        company,
        title,
        source_url,
        source_text,
        status,
        created_at,
        updated_at
      `)
      .order("updated_at", { ascending: false });

    if (input?.status) {
      query = query.eq("status", input.status);
    }

    if (input?.company) {
      query = query.ilike("company", `%${input.company}%`);
    }

    if (input?.keyword) {
      query = query.or(
        `company.ilike.%${input.keyword}%,title.ilike.%${input.keyword}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data.map(mapJobRow);
  }

  async updateJobStatus(input: UpdateJobStatusInput): Promise<JobRecord> {
    const { data, error } = await this.supabase
      .from("jobs")
      .update({
        status: input.status,
      })
      .eq("id", input.jobId)
      .select(`
        id,
        company,
        title,
        source_url,
        source_text,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    if (input.event) {
      const { error: eventError } = await this.supabase
        .from("application_events")
        .insert({
          job_id: input.jobId,
          type: input.event.type,
          note: input.event.note,
        });

      if (eventError) {
        throw eventError;
      }
    }

    return mapJobRow(data);
  }

  async addApplicationEvent(
    input: AddApplicationEventInput,
  ): Promise<ApplicationEventRecord> {
    const { data, error } = await this.supabase
      .from("application_events")
      .insert({
        job_id: input.jobId,
        type: input.type,
        note: input.note,
      })
      .select(`
      id,
      job_id,
      type,
      note,
      created_at
    `)
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      jobId: data.job_id,
      type: data.type,
      note: data.note,
      createdAt: data.created_at,
    };
  }

  async listApplicationEvents(
    jobId: string,
  ): Promise<ApplicationEventRecord[]> {
    const { data, error } = await this.supabase
      .from("application_events")
      .select(`
        id,
        job_id,
        type,
        note,
        created_at
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      id: row.id,
      jobId: row.job_id,
      type: row.type,
      note: row.note,
      createdAt: row.created_at,
    }));
  }
}