import { describe, expect, it, vi } from "vitest";
import { FetchJobPageError, fetchJobPage } from "./fetch-job-page";

describe("fetchJobPage", () => {
  it("returns the fetched page content", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        text: async () => "<html><body>Backend Engineer</body></html>",
      };
    });

    const result = await fetchJobPage("https://example.com/jobs/123", {
      fetch: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/jobs/123");
    expect(result).toEqual({
      url: "https://example.com/jobs/123",
      html: "<html><body>Backend Engineer</body></html>",
    });
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: false,
        status: 404,
        text: async () => "Not found",
      };
    });

    await expect(() =>
      fetchJobPage("https://example.com/jobs/missing", {
        fetch: fetchMock,
      }),
    ).rejects.toThrow(FetchJobPageError);
  });
});
