import { describe, expect, it } from "vitest";
import { createExportsServer } from "./exports";

describe("createExportsServer", () => {
    it("returns an export function", () => {
        const server = createExportsServer();

        expect(server.exportDocument).toBeTypeOf("function");
    });
});