import fs from "fs";
import path from "path";

// ✅ THIS is the correct DB
import { db } from "../apps/job-coach-web/src/server/db";

import { createDbCreateResumeProfile } from "../packages/db/src/resume-profiles/create-db-create-resume-profile";

async function main() {
  const filePath = path.resolve(process.argv[2]);

  const text = fs.readFileSync(filePath, "utf-8");

  const createResumeProfile = createDbCreateResumeProfile({
    db,
  });

  const result = await createResumeProfile({
    name: "Imported Resume",
    source: {
      kind: "import",
      label: "text-import",
    },
    normalizedResume: {
      basics: {
        fullName: "",
        headline: "",
        summary: text.slice(0, 500),
      },
      skills: [],
      experience: [],
      education: [],
      rawText: text,
    },
  });

  console.log(result);
}

main();
