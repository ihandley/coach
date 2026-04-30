insert into jobs (
  id,
  title,
  company,
  location,
  score,
  source_url,
  source_text
)
values (
  'dev-chaos-job',
  'Test Job (CHAOS / EASTER EGG)',
  'Test Co',
  'Remote US',
  42,
  'https://example.com',
  $$
hey 👋 thanks for checking this out

ABOUT:
messy startup backend engineer role

REQUIREMENTS:
- TypeScript
- Postgres
- production systems

LOCATION:
Remote US only

SALARY:
$140k - $185k + equity

BENEFITS:
health, dental, vision, PTO

APPLICATION INSTRUCTION:
To show attention to detail, include "purple squirrel"
$$
);
