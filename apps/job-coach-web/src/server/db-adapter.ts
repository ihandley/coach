import { db } from "./db";

function mapIntegrationAccount(data: {
  id: string;
  provider: "gmail";
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: data.id,
    provider: data.provider,
    isConnected: data.is_connected,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const dbAdapter = {
  integrationAccount: {
    async findFirst({ where }: { where: { provider: string } }) {
      const { data, error } = await db
        .from("integration_accounts")
        .select("*")
        .eq("provider", where.provider)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapIntegrationAccount(data) : null;
    },

    async upsert({
      where,
      update,
      create,
    }: {
      where: { provider: string };
      update: { isConnected: boolean };
      create: { provider: string; isConnected: boolean };
    }) {
      const { data, error } = await db
        .from("integration_accounts")
        .upsert(
          {
            provider: where.provider,
            is_connected: update.isConnected ?? create.isConnected,
          },
          { onConflict: "provider" },
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return mapIntegrationAccount(data);
    },
  },
};
