type DatabaseClient = {
    resumeProfile: {
        findUnique(args: {
            where: {
                id: string;
            };
        }): Promise<{
            id: string;
            name: string;
        } | null>;
    };
};

type ResumeProfileRecord = {
    id: string;
    name: string;
};

export class DbResumeProfileRepository {
    constructor(private readonly db: DatabaseClient) { }

    async getResumeProfileById(
        resumeProfileId: string,
    ): Promise<ResumeProfileRecord | null> {
        const record = await this.db.resumeProfile.findUnique({
            where: {
                id: resumeProfileId,
            },
        });

        if (!record) {
            return null;
        }

        return {
            id: record.id,
            name: record.name,
        };
    }
}