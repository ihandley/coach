import '@testing-library/jest-dom';

// Prevent double initialization in Vitest workers
if (!(globalThis as any).__JEST_DOM_LOADED__) {
  (globalThis as any).__JEST_DOM_LOADED__ = true;
}
