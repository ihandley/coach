import { createServerClient } from '../src/supabase/create-server-client';

async function seed() {
  const supabase = createServerClient();

  // Clear existing data
  await supabase.from('jobs').delete().neq('id', '');

  // Insert deterministic test data
  await supabase.from('jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error } = await supabase.from('jobs').insert([
    {
      id: 'dd3c5749-9c8c-4516-824b-4f09679088b8',
      title: 'Staff Software Engineer',
      company: 'Torus',
      source_url: 'https://example.com/torus-staff-software-engineer',
      source_text: 'Staff Software Engineer job posting from Torus',
      status: 'saved',
      created_at: '2024-01-01',
    },
    {
      id: '231aad1a-24c6-43e2-a1c8-d31d9ddb1d89',
      title: 'Senior Backend Engineer',
      company: 'Bloomlogic',
      source_url: 'https://example.com/acme-platform-engineer',
      source_text: 'Platform Engineer job posting from Acme',
      status: 'rejected',
      created_at: '2024-01-02',
    },
    {
      id: '21892539-c8e1-4e5b-9bb5-2f820d206fc2',
      title: 'Full Stack Engineer',
      company: 'Remi',
      source_url: 'https://example.com/old-role',
      source_text: 'Old archived role job posting',
      status: 'archived',
      created_at: '2024-01-03',
    },
  
    {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Test Job (CHAOS / EASTER EGG)',
      company: 'Test Co',
      source_url: 'https://example.com/jobs/chaos',
      source_text: `
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
`,
      status: 'saved',
      created_at: '2024-01-04',
    },

]);

  if (error) {
    throw error;
  }

  const { data, error: readError } = await supabase
    .from('jobs')
    .select('id,title,company,status');

  if (readError) {
    throw readError;
  }

  console.log('E2E seed complete', data);

}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
