import { defineConfig } from 'vitest/config';

/**
 * Loaded by the Angular unit-test builder (`runnerConfig` in angular.json) for what angular.json cannot
 * express: coverage thresholds per folder. They apply to `npm run test:coverage`; overall coverage is
 * reported but not gated.
 */
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        'src/app/core/**': { lines: 80 },
        'src/app/shared/**': { lines: 80 },
        'src/app/**/data-access/**': { lines: 80 },
      },
    },
  },
});
