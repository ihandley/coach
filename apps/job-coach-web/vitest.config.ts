import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        exclude: ["tests/**/*.spec.ts", "node_modules/**", ".next/**"],
        setupFiles: ["src/test/setup.ts"],
    },
});
