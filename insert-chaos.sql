insert into jobs (
  id,
  title,
  company,
  source_url,
  source_text,
  status
)
values (
  gen_random_uuid(),
  'Test Job (CHAOS / EASTER EGG)',
  'Test Co',
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
To show attention to detail, include 'purple squirrel'
$$,
  'saved'
);
