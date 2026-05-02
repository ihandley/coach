Refer to AGENTS.md for repository-wide guidance.

Key expectations:

- small, testable, issue-scoped changes
- use existing domain and DB helpers
- rely on seeded DEV fixtures (packages/db/seed/e2e.ts)
- run targeted tests for changed areas

Do not:

- invent mock endpoints or fake data
- create duplicate APIs when existing ones exist
- bypass repository contracts
