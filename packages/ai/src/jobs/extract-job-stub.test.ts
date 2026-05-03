import { describe, expect, it } from "vitest";
import { extractJobStub } from "./extract-job-stub";

describe("extractJobStub", () => {
  it("extracts company, title, and raw description from greenhouse-style html", async () => {
    const result = await extractJobStub({
      url: "https://example.com/jobs/123",
      html: `
        <html>
          <head>
            <meta property="og:title" content="Principal Software Engineer" />
            <meta property="og:description" content="Atlanta, GA" />
          </head>
          <body>
            <img alt="Stable Kernel Logo" />
            <div class="job__description body">
              <div>
                <h3>About the Role:</h3>
                <p>Build APIs and distributed systems.</p>
                <ul>
                  <li>Rust</li>
                  <li>AWS</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    expect(result.company).toBe("Stable Kernel");
    expect(result.title).toBe("Principal Software Engineer");
    expect(result.location).toBe("Atlanta, GA");
    expect(result.rawDescription).toContain("About the Role:");
    expect(result.rawDescription).toContain("Build APIs and distributed systems.");
    expect(result.rawDescription).toContain("- Rust");
  });

  it("falls back to Unknown when company or title cannot be found", async () => {
    const result = await extractJobStub({
      url: "https://example.com/jobs/123",
      html: `
        <html>
          <body>
            <div class="job__description body">
              <div>
                <p>Hello world</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    expect(result.company).toBe("Unknown");
    expect(result.title).toBe("Unknown");
    expect(result.rawDescription).toContain("Hello world");
  });
});
