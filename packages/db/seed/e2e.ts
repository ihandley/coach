import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from '../src/supabase/create-server-client';

async function seed() {
  const supabase = createServerClient();

  // Clear existing data
  await supabase.from('jobs').delete().neq('id', '');

  // Insert deterministic test data
  await supabase.from('jobs').insert([
    {
      id: uuidv4(),
      title: 'Staff Software Engineer',
      company: 'Torus',
      source_url: 'https://example.com/jobs/1',
      source_text: 'Engineering leadership role at Torus',
      status: 'saved',
      created_at: '2024-01-01',
    },
    {
      id: uuidv4(),
      title: 'Senior Backend Engineer',
      company: 'Bloomlogic',
      source_url: 'https://example.com/jobs/2',
      source_text: 'Backend platform role at Bloomlogic',
      status: 'rejected',
      created_at: '2024-01-02',
    },
    {
      id: uuidv4(),
      title: 'Full Stack Engineer',
      company: 'Remi',
      source_url: 'https://example.com/jobs/3',
      source_text: 'Full stack hiring at Remi',
      status: 'archived',
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
