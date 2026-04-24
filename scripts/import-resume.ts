import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const filePath = path.resolve(
    process.env.HOME!,
    "code/github/opencode/data/job-coach/resume.json",
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  const resume = JSON.parse(raw);

  const { data, error } = await supabase
    .from("resume_profiles")
    .insert({
      name: "Imported Resume",
      source: {
        kind: "import",
        label: "OpenCode import",
      },
      normalized_resume: {
        rawText: JSON.stringify(resume, null, 2),
      },
    })
    .select("id, name")
    .single();

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Imported:", data);
}

main();
