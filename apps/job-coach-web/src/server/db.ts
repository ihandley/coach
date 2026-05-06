import { getSupabaseClient } from "./supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const db = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  },
});

type KyselySelectState = {
  table: string;
  where?: {
    column: string;
    value: unknown;
  };
  orderBy?: {
    column: string;
    direction: "asc" | "desc";
  };
};

function mapKyselyRow(table: string, row: Record<string, unknown>) {
  if (table === "resume_versions" && "resume_profile_id" in row) {
    return {
      ...row,
      profile_id: row.resume_profile_id,
    };
  }

  return row;
}

function createSupabaseBackedKyselyReadAdapter() {
  return {
    selectFrom(table: string) {
      const state: KyselySelectState = { table };

      const builder = {
        selectAll() {
          return builder;
        },
        where(column: string, operator: string, value: unknown) {
          if (operator !== "=") {
            throw new Error(`Unsupported Kysely adapter operator: ${operator}`);
          }

          state.where = { column, value };

          return builder;
        },
        orderBy(column: string, direction: "asc" | "desc") {
          state.orderBy = { column, direction };

          return builder;
        },
        async execute() {
          let query = db.from(state.table).select("*");

          if (state.where) {
            query = query.eq(state.where.column, state.where.value);
          }

          if (state.orderBy) {
            query = query.order(state.orderBy.column, {
              ascending: state.orderBy.direction === "asc",
            });
          }

          const { data, error } = await query;

          if (error) {
            throw error;
          }

          return (data ?? []).map((row: Record<string, unknown>) => mapKyselyRow(state.table, row));
        },
        async executeTakeFirst() {
          let query = db.from(state.table).select("*");

          if (state.where) {
            query = query.eq(state.where.column, state.where.value);
          }

          const { data, error } = await query.maybeSingle();

          if (error) {
            throw error;
          }

          return data ? mapKyselyRow(state.table, data) : undefined;
        },
      };

      return builder;
    },
  };
}

export const kyselyDb = createSupabaseBackedKyselyReadAdapter();
