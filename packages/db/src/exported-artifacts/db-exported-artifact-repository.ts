export type ExportedArtifactRecord = {
    id: string;
    artifactType: string;
    sourceEntityType: string;
    sourceEntityId: string;
    fileName: string;
    storagePath: string;
    mimeType: string;
    checksumSha256: string;
    byteSize: number;
    createdAt: Date;
};

function mapExportedArtifact(row: {
    id: string;
    artifact_type: string;
    source_entity_type: string;
    source_entity_id: string;
    file_name: string;
    storage_path: string;
    mime_type: string;
    checksum_sha256: string;
    byte_size: number;
    created_at: string | Date;
}): ExportedArtifactRecord {
    return {
        id: row.id,
        artifactType: row.artifact_type,
        sourceEntityType: row.source_entity_type,
        sourceEntityId: row.source_entity_id,
        fileName: row.file_name,
        storagePath: row.storage_path,
        mimeType: row.mime_type,
        checksumSha256: row.checksum_sha256,
        byteSize: row.byte_size,
        createdAt: new Date(row.created_at),
    };
}

export function createDbExportedArtifactRepository({ db }: { db: any }) {
    return {
        async createExportedArtifact(input: {
            artifactType: string;
            sourceEntityType: string;
            sourceEntityId: string;
            fileName: string;
            storagePath: string;
            mimeType: string;
            checksumSha256: string;
            byteSize: number;
        }) {
            const row = await db
                .insertInto("exported_artifacts")
                .values({
                    artifact_type: input.artifactType,
                    source_entity_type: input.sourceEntityType,
                    source_entity_id: input.sourceEntityId,
                    file_name: input.fileName,
                    storage_path: input.storagePath,
                    mime_type: input.mimeType,
                    checksum_sha256: input.checksumSha256,
                    byte_size: input.byteSize,
                })
                .returningAll()
                .executeTakeFirstOrThrow();

            return mapExportedArtifact(row);
        },
    };
}