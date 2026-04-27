export function buildGmailQuery() {
  return `
    newer_than:365d
    ("thank you for applying"
    OR "thanks for applying"
    OR "application received"
    OR "your application"
    OR "regret to inform"
    OR "not moving forward"
    OR "interview"
    OR "recruiter"
    OR "hiring team"
    OR "talent acquisition")
  `;
}
