import { createServerClient } from '../src/supabase/create-server-client';

async function seed() {
  const supabase = createServerClient();

  // Clear existing data
  await supabase.from('jobs').delete().neq('id', '');

  // Insert deterministic test data
  await supabase.from('jobs').insert([
    {
      id: 'job-1',
      title: 'Staff Software Engineer',
      company: 'Torus',
      description: 'Test job 1',
      created_at: '2024-01-01',
    },
    {
      id: 'job-2',
      title: 'Senior Backend Engineer',
      company: 'Bloomlogic',
      description: 'Test job 2',
      created_at: '2024-01-02',
    },
    {
      id: 'job-3',
      title: 'Full Stack Engineer',
      company: 'Remi',
      description: 'Test job 3',
      created_at: '2024-01-03',
    },
  ]);

  console.log('E2E seed complete');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
