# GitHub Issue #29

- Title: Stage 12: Build job tracker list UI
- State: OPEN
- Labels: job-coach-rebuild, frontend, testing
- URL: https://github.com/ihandley/coach/issues/29
- Created: 2026-04-23T15:51:07Z
- Updated: 2026-04-23T15:51:07Z

## Body

## Summary\n\nBuild the first real tracker interface for the rebuilt Job Coach by adding a job list UI backed by the existing jobs data model.\n\n## Goal\n\nCreate a page that lets users view imported and newly created jobs in a usable tracker format.\n\n## Scope\n\nImplement:\n- job list page or dashboard section\n- rows/cards showing core job fields\n- empty state\n- loading state\n\n## Requirements\n\nShow:\n- company\n- title\n- status\n- updated date\n\nMake each job link to its future detail page.\n\n## Acceptance criteria\n\n- user can see all jobs\n- imported jobs appear\n- empty state works\n- each job links to `/jobs/[jobId]`\n- tests pass\n\n## Deliverables\n\n- job list UI\n- tests\n\n## Notes for ChatGPT when implementing this issue\n\nUse a step-by-step approach.\nKeep the first tracker list simple and reliable.\n
