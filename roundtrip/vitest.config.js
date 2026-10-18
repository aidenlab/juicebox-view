import { defineConfig } from 'vitest/config'

// Slow and not hermetic: juicebox.js reads its contact map from a public host.
export default defineConfig({
  test: {
    name: 'roundtrip',
    root: import.meta.dirname,
    environment: 'node',
    include: ['**/*.test.js'],
    globalSetup: ['./globalSetup.js'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
})
