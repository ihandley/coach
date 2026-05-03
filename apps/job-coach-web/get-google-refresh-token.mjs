import readline from "node:readline";
import { google } from "googleapis";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(q) {
  return new Promise((res) => rl.question(q, res));
}

const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");

const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent",
});

console.log("\nOpen this URL in your browser:\n");
console.log(url);
console.log("\nAfter approving, paste the code here:\n");

const code = await ask("> ");

const { tokens } = await oauth2Client.getToken(code);

console.log("\nREFRESH TOKEN:\n");
console.log(tokens.refresh_token || "(none returned)");

rl.close();
