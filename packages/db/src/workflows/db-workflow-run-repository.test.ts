import { describe, expect, it } from "vitest";
import { createDbWorkflowRunRepository } from "./db-workflow-run-repository.ts";

describe("createDbWorkflowRunRepository", () => {
    it("creates and updates workflow runs and steps", async () => {
        const workflowRuns = new Map<
            string,
            {
                id: string;
                workflow_type: string;
                status: string;
                input: Record<string, unknown>;
                current_step_key: string | null;
                error_message: string | null;
                retry_count: number;
                started_at: Date | null;
                completed_at: Date | null;
                created_at: Date;
            }
        >();

        const workflowSteps = new Map<
            string,
            {
                id: string;
                workflow_run_id: string;
                step_key: string;
                status: string;
                attempt_count: number;
                error_message: string | null;
                started_at: Date | null;
                completed_at: Date | null;
                created_at: Date;
            }
        >();

        const db = {
            insertInto(table: string) {
                if (table === "workflow_runs") {
                    return {
                        values(input: any) {
                            const row = {
                                id: crypto.randomUUID(),
                                ...input,
                                created_at: new Date(),
                            };

                            workflowRuns.set(row.id, row);

                            return {
                                returningAll() {
                                    return {
                                        executeTakeFirstOrThrow: async () => row,
                                    };
                                },
                            };
                        },
                    };
                }

                expect(table).toBe("workflow_steps");

                return {
                    values(input: any) {
                        const row = {
                            id: crypto.randomUUID(),
                            ...input,
                            created_at: new Date(),
                        };

                        workflowSteps.set(row.id, row);

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

            updateTable(table: string) {
                if (table === "workflow_runs") {
                    return {
                        set(input: Record<string, unknown>) {
                            return {
                                where(column: string, operator: string, value: string) {
                                    expect(column).toBe("id");
                                    expect(operator).toBe("=");

                                    return {
                                        returningAll() {
                                            return {
                                                executeTakeFirst: async () => {
                                                    const existing =
                                                        workflowRuns.get(value);

                                                    if (!existing) {
                                                        return undefined;
                                                    }

                                                    const updated = {
                                                        ...existing,
                                                        ...input,
                                                    };

                                                    workflowRuns.set(value, updated);

                                                    return updated;
                                                },
                                            };
                                        },
                                    };
                                },
                            };
                        },
                    };
                }

                expect(table).toBe("workflow_steps");

                return {
                    set(input: Record<string, unknown>) {
                        return {
                            where(column: string, operator: string, value: string) {
                                expect(column).toBe("id");
                                expect(operator).toBe("=");

                                return {
                                    returningAll() {
                                        return {
                                            executeTakeFirst: async () => {
                                                const existing =
                                                    workflowSteps.get(value);

                                                if (!existing) {
                                                    return undefined;
                                                }

                                                const updated = {
                                                    ...existing,
                                                    ...input,
                                                };

                                                workflowSteps.set(value, updated);

                                                return updated;
                                            },
                                        };
                                    },
                                };
                            },
                        };
                    },
                };
            },

            selectFrom(table: string) {
                if (table === "workflow_runs") {
                    return {
                        selectAll() {
                            return {
                                where(column: string, operator: string, value: string) {
                                    expect(column).toBe("id");
                                    expect(operator).toBe("=");

                                    return {
                                        executeTakeFirst: async () =>
                                            workflowRuns.get(value) ?? undefined,
                                    };
                                },
                                orderBy(column: string, direction: string) {
                                    expect(column).toBe("created_at");
                                    expect(direction).toBe("asc");

                                    return {
                                        execute: async () =>
                                            Array.from(workflowRuns.values()),
                                    };
                                },
                            };
                        },
                    };
                }

                expect(table).toBe("workflow_steps");

                return {
                    selectAll() {
                        return {
                            where(column: string, operator: string, value: string) {
                                expect(column).toBe("workflow_run_id");
                                expect(operator).toBe("=");

                                return {
                                    orderBy(orderColumn: string, direction: string) {
                                        expect(orderColumn).toBe("created_at");
                                        expect(direction).toBe("asc");

                                        return {
                                            execute: async () =>
                                                Array.from(workflowSteps.values()).filter(
                                                    (step) =>
                                                        step.workflow_run_id === value,
                                                ),
                                        };
                                    },
                                };
                            },
                        };
                    },
                };
            },
        };

        const repository = createDbWorkflowRunRepository({ db });

        const createdRun = await repository.createWorkflowRun({
            workflowType: "import-job-and-score-fit",
            input: {
                jobUrl: "https://example.com/job/1",
            },
        });

        expect(createdRun).toMatchObject({
            id: expect.any(String),
            workflowType: "import-job-and-score-fit",
            status: "queued",
            retryCount: 0,
            createdAt: expect.any(Date),
        });

        const updatedRun = await repository.updateWorkflowRun({
            workflowRunId: createdRun.id,
            status: "running",
            currentStepKey: "import-job",
            retryCount: 1,
        });

        expect(updatedRun).toMatchObject({
            id: createdRun.id,
            status: "running",
            currentStepKey: "import-job",
            retryCount: 1,
        });

        const fetchedRun = await repository.getWorkflowRunById(createdRun.id);

        expect(fetchedRun).toMatchObject({
            id: createdRun.id,
            status: "running",
            currentStepKey: "import-job",
        });

        const createdStep = await repository.createWorkflowStep({
            workflowRunId: createdRun.id,
            stepKey: "import-job",
        });

        expect(createdStep).toMatchObject({
            id: expect.any(String),
            workflowRunId: createdRun.id,
            stepKey: "import-job",
            status: "pending",
            attemptCount: 0,
            createdAt: expect.any(Date),
        });

        const updatedStep = await repository.updateWorkflowStep({
            workflowStepId: createdStep.id,
            status: "failed",
            attemptCount: 1,
            errorMessage: "temporary failure",
        });

        expect(updatedStep).toMatchObject({
            id: createdStep.id,
            status: "failed",
            attemptCount: 1,
            errorMessage: "temporary failure",
        });

        const runs = await repository.listWorkflowRuns();
        const steps = await repository.listWorkflowStepsByRunId(createdRun.id);

        expect(runs).toHaveLength(1);
        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            id: createdStep.id,
            stepKey: "import-job",
            status: "failed",
        });
    });
});