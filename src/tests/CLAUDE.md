# Tests

This directory contains tests for the application, run with Bun's built-in test runner (`bun:test`).

## Files

- `setup.ts` - Preloaded by `bun test` (see `bunfig.toml`); sets mock env vars and a temporary `PROCESSED_STARS_CACHE`
- `config.test.ts` - Configuration validation tests
- `core.test.ts` - Core processor logic tests
- `services.test.ts` - Service layer tests
- `types.test.ts` - Type definition tests
- `integration.test.ts` - Integration tests
- `processed-stars.test.ts` - Processed stars cache tests
- `tweet-utils.test.ts` - Tweet length utility tests

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/tests/services.test.ts

# Run tests whose name matches a pattern
bun test -t 'trimReadme'
```

## Testing Patterns

### Test Structure (BDD Style)

```typescript
import { describe, expect, it } from 'bun:test';

describe('ServiceName', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expectedValue);
    });
  });
});
```

### Mock Data

Create mock data at the top of test files:

```typescript
const mockStarData: StarData = {
  repo: 'test-org/awesome-project',
  description: 'Test description',
  url: 'https://github.com/test-org/awesome-project',
  primaryLanguage: 'TypeScript',
  readme: 'Test README content',
  starredAt: new Date('2024-01-01T10:00:00Z'),
};
```

### Assertions

Common matchers from `bun:test` (Jest compatible):

- `expect(actual).toEqual(expected)` - Deep equality
- `expect(actual).toBe(expected)` - Strict (`Object.is`) equality
- `expect(value).not.toBeNil()` - Not null/undefined
- `expect(fn).toThrow()` - Function throws error
- `await expect(promise).rejects.toThrow()` - Promise rejects

### Environment Variables

Modules under `src/config` and `src/ai` validate env vars at import time, and Bun shares the
module cache across test files. Use the shared `mockEnvVars` from `setup.ts` instead of
defining per-file values.

## Adding New Tests

1. Add tests to existing files if related to existing modules
2. Create new test file for new modules: `{module}.test.ts`
3. Follow BDD structure with `describe` and `it`
4. Use meaningful test descriptions that explain expected behavior
