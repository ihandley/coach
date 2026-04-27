import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResumeProfile } from "@coach/core";

type DbResumeProfileRow = {
    id: string;
    name: string;
    current_version_id?: string | null;
    created_at: string;
};

function mapResumeProfile(row: DbResumeProfileRow): ResumeProfile {
    return {
        id: row.id,
        name: row.name,
        currentVersionId: row.current_version_id ?? "",
    };
}

export function createDbResumeProfileRepository({ db }: { db: SupabaseClient }) {
    return {
        async listResumeProfiles() {
            const { data, error } = await db
                .from("resume_profiles")
                .select("id, name, current_version_id, created_at")
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            return data.map(mapResumeProfile);
        },

        async createResumeProfile(input: {
            name: string;
            currentVersionId: string;
        }) {
            const { data, error } = await db
                .from("resume_profiles")
                .insert({
                    name: input.name,
                    current_version_id: input.currentVersionId,
                })
                .select("id, name, current_version_id, created_at")
                .single();

            if (error) {
                throw error;
            }

            return mapResumeProfile(data);
        },

        async getResumeProfileById(resumeProfileId: string) {
            const { data, error } = await db
                .from("resume_profiles")
                .select("id, name, current_version_id, created_at")
                .eq("id", resumeProfileId)
                .single();

            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                throw error;
            }

            return mapResumeProfile(data);
        },

        async updateResumeProfileCurrentVersion(input: {
            resumeProfileId: string;
            currentVersionId: string;
        }) {
            const { data, error } = await db
                .from("resume_profiles")
                .update({
                    current_version_id: input.currentVersionId,
                })
                .eq("id", input.resumeProfileId)
                .select("id, name, current_version_id, created_at")
                .single();

            if (error) {
                throw error;
            }

            return mapResumeProfile(data);
        },
    };
}
