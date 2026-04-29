import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, key);

async function run() {
  console.log("Exporting data...");

  const [jobs, resumes] = await Promise.all([
    supabase.from("jobs").select("*"),
    supabase.from("resume_profiles").select("*"),
  ]);

  const data = {
    jobs: jobs.data ?? [],
    resumes: resumes.data ?? [],
    exportedAt: new Date().toISOString(),
  };

  fs.mkdirSync("backups", { recursive: true });

  const file = `backups/export-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  console.log("Export complete:", file);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
