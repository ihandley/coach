export default function HomePage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Job Coach</h1>
        <p className="mt-2 text-lg text-gray-600">Your personal job search assistant</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold mt-0.5">1.</span>
            <div>
              <strong>Import a Job</strong>
              <p className="text-sm text-gray-600">
                Go to Jobs and paste a job posting URL to get started
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold mt-0.5">2.</span>
            <div>
              <strong>Add Your Resume</strong>
              <p className="text-sm text-gray-600">Go to Resumes and paste your resume text</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold mt-0.5">3.</span>
            <div>
              <strong>Get Match Scores</strong>
              <p className="text-sm text-gray-600">
                Click Match on any job to see how well it fits your background
              </p>
            </div>
          </li>
        </ul>
      </div>

      <p className="text-sm text-gray-600">Job Coach web app is running.</p>
    </main>
  );
}
