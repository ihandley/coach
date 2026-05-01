
## Database Access Pattern

This system uses a **Supabase-backed repository pattern with a Kysely-like interface**.

### Key Points

- The application does **NOT use Kysely directly**
- The application does **NOT use raw Supabase calls in domain logic**
- Instead, it uses:
  - Repository layer (`db-*`)
  - Use-case layer (`create-db-*`)
  - A **query-style abstraction** inspired by Kysely

### Layers

Domain (core)
→ Use Cases (`create-db-*`)
→ Repositories (`db-*`)
→ Query Interface (Kysely-like methods such as `insertInto`, `selectFrom`)
→ Supabase Client (`from`, `insert`, `select`, etc.)
→ Postgres (Supabase)

### Testing Strategy

- Tests use a **Supabase mock** (`createSupabaseMock`)
- The mock implements:
  - `from().insert()`
  - `from().select().eq().single()`
  - `from().update().eq().select().single()`
- This allows:
  - Fast unit tests
  - No real database dependency
  - Deterministic behavior

### Important Constraints

- All DB writes must go through `create-db-*` use cases
- Repositories define the contract for persistence
- Domain logic must remain DB-agnostic
- Do NOT introduce direct Supabase calls in core/domain
- Do NOT introduce real Kysely unless the entire stack is migrated

