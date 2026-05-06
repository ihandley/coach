export function createSupabaseMock() {
  const store = new Map<string, any>();

  return {
    from(_table: string) {
      return {
        insert(input: any) {
          const row = {
            ...input,
            id: input.id ?? crypto.randomUUID(),
          };

          store.set(row.id, row);

          return {
            select() {
              return {
                single: async () => ({ data: row, error: null }),
              };
            },
          };
        },

        select() {
          return {
            eq(_: string, value: string) {
              return {
                single: async () => ({
                  data: store.get(value) ?? null,
                  error: store.has(value) ? null : { code: "PGRST116" },
                }),
              };
            },
          };
        },

        update(input: any) {
          return {
            eq(_: string, value: string) {
              const existing = store.get(value);

              const updated = existing ? { ...existing, ...input } : null;

              if (updated) store.set(value, updated);

              return {
                select() {
                  return {
                    single: async () => ({
                      data: updated,
                      error: updated ? null : { code: "PGRST116" },
                    }),
                  };
                },
              };
            },
          };
        },
      };
    },
  } as any;
}
