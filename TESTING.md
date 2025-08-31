# Testing Guide

This project uses Vitest as the testing framework for unit tests. The setup is minimal but covers critical areas of the codebase.

## Running Tests

```bash
# Run all tests once and exit
npm test

# Run tests in watch mode (stays running)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

## Test Structure

Tests are co-located with the source files they test, using the `.test.ts` or `.spec.ts` suffix.

```
lib/
├── server-action-result.ts
├── server-action-result.test.ts  # Tests for server-action-result.ts
├── utils.ts
└── utils.test.ts                 # Tests for utils.ts
```

## What We Test

### High-Value Areas Currently Tested:

1. **Server Action Result Utilities** (`lib/server-action-result.test.ts`)
   - Success/error result creation
   - Validation error handling
   - Safe server action wrapper
   - Type safety

2. **Server Action Helpers** (`lib/server-action-helpers.test.ts`)
   - Result handling with automatic redirects
   - Error handling with fallbacks
   - Authorization flow redirects

3. **Utility Functions** (`lib/utils.test.ts`)
   - Class name merging with tailwind-merge
   - Conditional class handling

4. **Database Actions** (`lib/db_actions/categories.test.ts`)
   - Authentication checks
   - Data fetching
   - Error handling

5. **Authentication** (`lib/auth/login.test.ts`)
   - Login flow validation
   - Impersonation authorization
   - Integration with database layer

## Testing Best Practices

### 1. Mock External Dependencies

```typescript
// Mock Next.js modules
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

// Mock database
vi.mock("@/lib/database", () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));
```

### 2. Test Both Success and Error Cases

```typescript
it("should return data on success", () => {
  // Test happy path
});

it("should handle errors gracefully", () => {
  // Test error scenarios
});
```

### 3. Use Type-Safe Mocks

```typescript
const mockUser = {
  id: 1,
  login_id: 1,
  username: "testuser",
  is_admin: false,
} satisfies Partial<User>;
```

## Areas for Future Testing

While we've covered the most critical utilities and helpers, here are areas that would benefit from additional test coverage:

1. **Form Validation Schemas** - Zod schemas in forms should be tested
2. **API Route Handlers** - Server actions that handle complex business logic
3. **React Components** - Using React Testing Library for component behavior
4. **Database Migrations** - Ensure migrations run correctly
5. **Email Service** - Mock email sending and verify templates

## Configuration

The test configuration is in `vitest.config.ts`:

- Tests run in Node environment by default
- Path aliases are configured to match Next.js
- Coverage excludes UI components (tested via Storybook)
- Globals are enabled for cleaner test syntax

## Continuous Integration

To add tests to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --run

- name: Upload coverage
  run: npm run test:coverage
```

## Troubleshooting

### Environment Variables

Some tests may fail if they depend on environment variables. Use `vi.stubEnv()` to mock them:

```typescript
beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

### Next.js Server Components

Server components and server actions require special mocking:

```typescript
// Mock cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));
```

### Database Queries

Mock Kysely query builders by chaining mock functions:

```typescript
const mockExecute = vi.fn();
const mockSelectAll = vi.fn(() => ({ execute: mockExecute }));
vi.mocked(db.selectFrom).mockReturnValue({
  selectAll: mockSelectAll,
} as any);
```
