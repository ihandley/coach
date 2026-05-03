import { loadEnvFromKeychain } from '../src/env/load-env';
import { createServerClient } from '../src/supabase/create-server-client';

const patternJobId = '11111111-1111-4111-8111-111111111111';
const torusJobId = 'dd3c5749-9c8c-4516-824b-4f09679088b8';
const bloomlogicJobId = '231aad1a-24c6-43e2-a1c8-d31d9ddb1d89';
const remiJobId = '21892539-c8e1-4e5b-9bb5-2f820d206fc2';
const chaosJobId = '00000000-0000-4000-8000-000000000001';

const resumeProfileId = '11111111-1111-4111-8111-111111111111';
const resumeVersionId = '22222222-2222-4222-8222-222222222222';

const patternStaffPredictSourceText = `About the job

Are you obsessed with data, partner success, taking action, and changing the game? If you have a whole lot of hustle and a touch of nerd, come work with Pattern! We want you to use your skills to push one of the fastest-growing companies headquartered in the US to the top of the list.

Pattern accelerates brands on global ecommerce marketplaces leveraging proprietary technology and AI. Utilizing more than 66 trillion data points, sophisticated machine learning and AI models, Pattern optimizes and automates all levers of ecommerce growth for global brands, including advertising, content management, logistics and fulfillment, pricing, forecasting and customer service. Hundreds of global brands depend on Pattern’s ecommerce acceleration platform every day to drive profitable revenue growth across 60+ global marketplaces—including Amazon, Walmart.com, Target.com, eBay, Tmall, TikTok Shop, JD, and Mercado Libre. To learn more, visit pattern.com or email [email protected].

Pattern has been named one of the fastest growing tech companies headquartered in North America by Deloitte and one of best-led companies by Inc. We place employee experience at the center of our business model and have been recognized as one of Newsweek’s Global Most Loved Workplaces®.

We are looking for a Staff Software Engineer to be part of a small, scrappy, autonomous team building and owning processes that will impact millions of dollars in revenue. You will be the technical engine behind our marketplace integrations, designing elegant, high-quality code to solve complex business problems at a global scale. This is a high-energy role where you will drive architectural excellence and mentor the next generation of top engineering talent.

This is a full-time role and will work a hybrid schedule in Lehi, Utah.

The Predict product surfaces data-driven recommendations for ecommerce operators. The team works across TypeScript, React product workflows, Node.js services, relational and NoSQL data stores, distributed backend systems, and high-volume marketplace data integrations.

What is a day in the life of a Principal Software Engineer?

- Lead software engineers to deliver innovative, high-quality products on a foundation of architectural and engineering excellence.
- Design and write elegant, high-quality code to solve complex business problems.
- Collaborate cross-functionally with business teams to define, deliver, and support software and services that meet customer needs.
- Guide software engineers through planning, designing, coding, delivery, and support, driving day-to-day technical decisions.
- Own and continually improve the throughput and stability of product delivery and application lifecycle, in partnership with product and program management.
- Distill complex and ambiguous situations into actionable plans for your team and for customer-facing scenarios.
- Communicate and collaborate internally and with partners on technical details, ensuring alignment between technical capabilities and customer requirements.
- Train and develop top engineering talent while also mentoring business teams on technical aspects of products.

What will I need to thrive in this role?

- Bachelor's or Master’s degree in Software Engineering, Computer Science, or a related field.
- 10+ years of professional software development experience.
- Broad understanding of coding and programming languages, including TypeScript and modern React.
- Experience building backend systems, distributed services, and data-intensive product workflows.
- Experience with database design and data modeling.
- Extensive knowledge of the software development process and corresponding technologies.
- Excellent understanding of design patterns and architectural styles.

What does high performance look like?

- Project Completion: Successfully designing and maintaining complex APIs and third-party integrations that handle massive data flows without downtime.
- Execution: Achieving measurable improvements in the throughput and stability of the marketplace core services.
- Team Impact: Inspiring confidence through technical leadership and creating relationships of trust through effective mentoring and coaching.
- Team of Doers: Taking proactive initiative to help the team in any circumstance and holding oneself accountable to both the team and global partners.

What is my potential for career growth?

- Gain deep exposure to global marketplace APIs (Amazon, Walmart, etc.) and solve world-class scaling challenges.
- Broaden technical expertise by working on the "engine room" of Pattern, impacting millions in daily inventory movement.
- Build a massive internal network by collaborating cross-functionally with senior leadership and global business teams.

What does success look like in the first 30, 60, 90 days?

- 30 Days: Complete onboarding, understand the Marketplace Core architecture, and begin contributing to high-quality code reviews.
- 60 Days: Take ownership of a specific integration feature and lead a small sprint cycle from design to delivery.
- 90 Days: Identify and implement a significant architectural improvement or performance optimization for the core data pipeline.

What is the team like?

This role reports directly to the Associate Director of Engineering. You will be joining a small, scrappy, autonomous team of professionals. In this role, you will collaborate closely with Software Engineers, Product Managers, and Program Managers as well as other departments including Engineering and Sales. This position is mentored by Engineering Leadership.

We Are Looking For Individuals Who Are

- Game Changers: Someone who looks at problems with an open mind, shares new ideas, reassesses plans, attaches realistic timelines to goals, and pursues improvements to Pattern’s processes and outcomes.
- Data Fanatics: Someone who recognizes problems, seeks to understand them through data, draws unbiased conclusions, and tracks the effects of solutions using data.
- Partner Obsessed: Someone who clearly explains project status, listens to partner expectations, delivers results that exceed them, and prioritizes partner needs.
- Team of Doers: Someone who uplifts team members, takes initiative, actively supports improvements, and holds themselves accountable to the team and partners.

What is the hiring process?

- Initial phone interview with Pattern’s talent acquisition team.
- Technical interview with a member of the team.
- Video interview with a hiring manager.
- Onsite interviews with Engineering leaders, including a system design session.
- Professional reference checks.
- Executive review.
- Offer.

How can I stand out as an applicant?

- Previous experience in E-commerce or AdTech, specifically with Amazon SP-API or Walmart Marketplace APIs.
- Experience with NoSQL databases like MongoDB or DynamoDB.
- Familiarity with containerization and orchestration using Docker and Kubernetes.

Why should I work at Pattern?

Pattern offers big opportunities to make a difference in the ecommerce industry. We are a company full of talented people that evolves quickly and often. We set big goals, work tirelessly to achieve them, and we love our Pattern community. We also believe in having fun and balancing our lives.

Benefits

- Unlimited PTO
- Paid Holidays
- Onsite Fitness Center
- Company Paid Life Insurance
- Casual Dress Code
- Competitive Pay
- Health, Vision, and Dental Insurance
- 401(k) match. Pattern matches 100% of the first 3% in eligible compensation deferred and 50% of the next 2% in eligible compensation deferred.

Pattern provides equal employment opportunities to all employees and applicants for employment and prohibits discrimination and harassment of any type.

We may use artificial intelligence (AI) tools to support parts of the hiring process, such as reviewing applications, analyzing resumes, or assessing responses. These tools assist our recruitment team but do not replace human judgment. Final hiring decisions are ultimately made by humans.`;

const patternStructuredSummary = {
  location: 'Lehi, UT — Hybrid',
  salaryRange: null,
  companyInfo: [
    'Pattern accelerates brands on global ecommerce marketplaces using proprietary technology, machine learning, and AI.',
    'Pattern supports global brands across 60+ marketplaces including Amazon, Walmart, Target, eBay, Tmall, TikTok Shop, JD, and Mercado Libre.',
    'The company has been recognized by Deloitte, Inc., and Newsweek.',
  ],
  jobDescription: [
    'Lead architecture and engineering quality for marketplace integrations.',
    'Design and write high-quality TypeScript, React, and backend services for complex global-scale business problems.',
    'Mentor engineers and guide technical decisions through planning, delivery, and support.',
    'Improve throughput and stability of distributed product delivery and data-intensive application lifecycle.',
  ],
  requirements: [
    '10+ years of professional software development experience.',
    'Bachelor’s or Master’s degree in Software Engineering, Computer Science, or a related field.',
    'TypeScript, React, backend systems, and distributed services experience.',
    'Experience with database design, data modeling, and data-driven product workflows.',
    'Strong understanding of design patterns and architectural styles.',
    'Ability to lead engineers and collaborate cross-functionally with product, program, and business partners.',
  ],
  benefits: [
    'Unlimited PTO',
    'Paid holidays',
    'Onsite fitness center',
    'Company-paid life insurance',
    'Health, vision, and dental insurance',
    '401(k) match',
  ],
};

const normalizedResume = {
  basics: {
    fullName: 'Jordan Lee',
    headline: 'Senior Software Engineer',
    summary:
      'Senior software engineer with React, TypeScript, Node.js, PostgreSQL, and cloud backend experience. Leads pragmatic delivery for customer-facing product teams and mentors engineers through code reviews and technical planning.',
  },
  skills: [
    'TypeScript',
    'React',
    'Node.js',
    'PostgreSQL',
    'REST APIs',
    'Backend services',
    'AWS',
    'CI/CD',
    'Observability',
    'Technical leadership',
  ],
  experience: [
    {
      company: 'Northstar Product Labs',
      title: 'Senior Software Engineer',
      highlights: [
        'Led a React and TypeScript rebuild of account management workflows used by enterprise customer success teams.',
        'Designed Node.js backend services and PostgreSQL schemas for subscription, permissions, and reporting features.',
        'Mentored four engineers through design reviews, incident follow-up, and incremental delivery planning.',
      ],
    },
    {
      company: 'Atlas Health',
      title: 'Software Engineer',
      highlights: [
        'Built API integrations between internal operations tools and third-party provider systems.',
        'Partnered with product managers to clarify ambiguous requirements and ship measurable workflow improvements.',
        'Improved production reliability with structured logging, alert tuning, and regression test coverage.',
      ],
    },
  ],
  education: [
    {
      school: 'University of Utah',
      degree: 'BS Computer Science',
    },
  ],
};

function assertNoError(error: unknown) {
  if (error) {
    throw error;
  }
}

async function seed() {
  loadEnvFromKeychain();

  const supabase = createServerClient();

  const { error: matchDeleteError } = await supabase
    .from('job_matches')
    .delete()
    .neq('job_id', '00000000-0000-0000-0000-000000000000');
  assertNoError(matchDeleteError);

  const { error: clearCurrentVersionError } = await supabase
    .from('resume_profiles')
    .update({ current_version_id: null })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  assertNoError(clearCurrentVersionError);

  const { error: resumeVersionsDeleteError } = await supabase
    .from('resume_versions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  assertNoError(resumeVersionsDeleteError);

  const { error: resumeProfilesDeleteError } = await supabase
    .from('resume_profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  assertNoError(resumeProfilesDeleteError);

  const { error: jobsDeleteError } = await supabase
    .from('jobs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  assertNoError(jobsDeleteError);

  const { error: jobsError } = await supabase.from('jobs').insert([
    {
      id: patternJobId,
      title: 'Staff Software Engineer, Predict',
      company: 'Pattern',
      source_url: 'https://www.linkedin.com/jobs/',
      source_text: patternStaffPredictSourceText,
      structured_summary: patternStructuredSummary,
      status: 'saved',
      created_at: '2024-01-10T12:00:00.000Z',
      updated_at: '2024-01-10T12:00:00.000Z',
    },
    {
      id: torusJobId,
      title: 'Staff Software Engineer',
      company: 'Torus',
      source_url: 'https://example.com/torus-staff-software-engineer',
      source_text:
        'Staff Software Engineer role focused on reliable full-stack product delivery, TypeScript APIs, React interfaces, and distributed energy systems.',
      status: 'saved',
      created_at: '2024-01-07T12:00:00.000Z',
      updated_at: '2024-01-07T12:00:00.000Z',
    },
    {
      id: bloomlogicJobId,
      title: 'Senior Backend Engineer',
      company: 'Bloomlogic',
      source_url: 'https://example.com/bloomlogic-backend-engineer',
      source_text:
        'Senior backend engineering role building data pipelines, service APIs, Postgres-backed workflows, and production reliability improvements.',
      status: 'rejected',
      created_at: '2024-01-06T12:00:00.000Z',
      updated_at: '2024-01-06T12:00:00.000Z',
    },
    {
      id: remiJobId,
      title: 'Full Stack Engineer',
      company: 'Remi',
      source_url: 'https://example.com/remi-full-stack-engineer',
      source_text:
        'Full Stack Engineer role building React tools and backend APIs for warranty operations.',
      status: 'archived',
      created_at: '2024-01-05T12:00:00.000Z',
      updated_at: '2024-01-05T12:00:00.000Z',
    },
    {
      id: chaosJobId,
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
      created_at: '2024-01-04T12:00:00.000Z',
      updated_at: '2024-01-04T12:00:00.000Z',
    },
  ]);
  assertNoError(jobsError);

  const { error: profileError } = await supabase.from('resume_profiles').insert({
    id: resumeProfileId,
    name: 'E2E Resume',
    source: {
      kind: 'manual',
      label: 'E2E seed baseline',
    },
    normalized_resume: normalizedResume,
  });
  assertNoError(profileError);

  const { error: versionError } = await supabase.from('resume_versions').insert({
    id: resumeVersionId,
    resume_profile_id: resumeProfileId,
    version_number: 1,
    kind: 'baseline',
    source_kind: 'manual',
    source_label: 'E2E seed baseline',
    normalized_resume: normalizedResume,
  });
  assertNoError(versionError);

  const { error: currentVersionError } = await supabase
    .from('resume_profiles')
    .update({ current_version_id: resumeVersionId })
    .eq('id', resumeProfileId);
  assertNoError(currentVersionError);

  const { error: matchInsertError } = await supabase.from('job_matches').insert([
    {
      job_id: patternJobId,
      resume_profile_id: resumeProfileId,
      score: 86,
    },
    {
      job_id: torusJobId,
      resume_profile_id: resumeProfileId,
      score: 64,
    },
    {
      job_id: bloomlogicJobId,
      resume_profile_id: resumeProfileId,
      score: 41,
    },
    {
      job_id: remiJobId,
      resume_profile_id: resumeProfileId,
      score: 28,
    },
    {
      job_id: chaosJobId,
      resume_profile_id: resumeProfileId,
      score: 1,
    },
  ]);
  assertNoError(matchInsertError);

  const { data, error: readError } = await supabase
    .from('jobs')
    .select('id,title,company,status')
    .order('created_at', { ascending: false });
  assertNoError(readError);

  console.log('E2E seed complete', data);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
