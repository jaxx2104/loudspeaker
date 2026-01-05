# Tests

This directory contains Deno standard tests for the application.

## Files

- `config.test.ts` - Configuration validation tests
- `core.test.ts` - Core processor logic tests
- `services.test.ts` - Service layer tests
- `types.test.ts` - Type definition tests
- `integration.test.ts` - Integration tests

## Running Tests

```bash
# Run all tests
deno task test

# Run specific test file
deno test --allow-net --allow-env --allow-read src/tests/services.test.ts

# Run with verbose output
deno test --allow-net --allow-env --allow-read src/tests/ --reporter=verbose
```

## Testing Patterns

### Test Structure (BDD Style)

```typescript
import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';

describe('ServiceName', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      assertEquals(result, expectedValue);
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

Common assertions from `@std/assert`:
- `assertEquals(actual, expected)` - Strict equality
- `assertExists(value)` - Not null/undefined
- `assertThrows(fn)` - Function throws error
- `assertRejects(asyncFn)` - Async function rejects

## Adding New Tests

1. Add tests to existing files if related to existing modules
2. Create new test file for new modules: `{module}.test.ts`
3. Follow BDD structure with `describe` and `it`
4. Use meaningful test descriptions that explain expected behavior
