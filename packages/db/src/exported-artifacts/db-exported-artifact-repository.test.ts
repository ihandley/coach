import { describe, expect, it } from "vitest";
import { createDbExportedArtifactRepository } from "./db-exported-artifact-repository";

describe("createDbExportedArtifactRepository", () => {
  it("creates an exported artifact record", async () => {
    const db = {
      insertInto(table: string) {
        expect(table).toBe("exported_artifacts");

        return {
          values(input: any) {
            const row = {
              id: "artifact-1",
              ...input,
              created_at: new Date().toISOString(),
            };

            return {
              returningAll() {
                return {
                  executeTakeFirstOrThrow: async () => row,
                };
              },
            };
          },
        };
      },
    };

    const repo = createDbExportedArtifactRepository({ db });

    const created = await repo.createExportedArtifact({
      artifactType: "resume",
      sourceEntityType: "resume_version",
      sourceEntityId: "rv1",
      fileName: "resume-rp1-rv1.pdf",
      storagePath: "exports/resume-profiles/rp1/resume-versions/rv1/resume-rp1-rv1.pdf",
      mimeType: "application/pdf",
      checksumSha256: "abc",
      byteSize: 123,
    });

    expect(created).toMatchObject({
      id: "artifact-1",
      artifactType: "resume",
      sourceEntityType: "resume_version",
      sourceEntityId: "rv1",
      fileName: "resume-rp1-rv1.pdf",
      storagePath: "exports/resume-profiles/rp1/resume-versions/rv1/resume-rp1-rv1.pdf",
      mimeType: "application/pdf",
      checksumSha256: "abc",
      byteSize: 123,
      createdAt: expect.any(Date),
    });
  });
});
