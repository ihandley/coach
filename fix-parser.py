from pathlib import Path

p = Path("apps/job-coach-web/src/app/jobs/jobs-page-client.tsx")
t = p.read_text()

# Replace parser
t = t.replace(
"function parseStructured(text: string) {",
"""function parseStructured(text: string) {
  const sections = [
    { title: "About Company / Position", patterns: [/about us/i, /about the company/i, /about this role/i, /position/i] },
    { title: "Requirements", patterns: [/requirements/i, /qualifications/i, /must have/i, /experience/i] },
    { title: "Responsibilities", patterns: [/responsibilities/i, /what you'll do/i, /day to day/i] },
    { title: "Salary / Compensation", patterns: [/salary/i, /compensation/i, /pay range/i, /equity/i] },
    { title: "Location", patterns: [/location/i, /remote/i, /hybrid/i, /onsite/i] },
    { title: "Benefits", patterns: [/benefits/i, /perks/i, /health/i, /pto/i, /401k/i] },
    { title: "Application Instructions / Easter Eggs", patterns: [/include .* application/i, /write .* application/i, /attention to detail/i, /do not use ai/i, /chatgpt/i] },
  ];

  const result = [];
  let current = { title: "Description", content: [], attention: False };

  for rawLine in text.split("\\n"):
    line = rawLine.strip()
    if not line:
        continue

    matched = next((s for s in sections if any(p.search(line) for p in s["patterns"])), None)

    if matched:
        if current["content"]:
            result.append(current)
        current = {
            "title": matched["title"],
            "content": [],
            "attention": "Easter" in matched["title"],
        }
        continue

    current["content"].append(line.lstrip("-•* ").strip())

  if current["content"]:
      result.append(current)

  return result
"""
)

p.write_text(t)
