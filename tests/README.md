# Testcontainers Implementation

This project now includes comprehensive testing with **testcontainers** for real PostgreSQL database testing.

## Overview

The testcontainers implementation provides:

- **Real PostgreSQL testing**: Tests run against actual PostgreSQL instances instead of mocks
- **Database isolation**: Each test run gets a clean database container
- **Migration testing**: All migrations are run automatically in test containers
- **RLS testing**: Row Level Security policies are tested with real database permissions
- **Integration testing**: Complete workflows tested end-to-end

## Architecture

### Test Infrastructure

- `tests/setup.ts` - Global test setup and teardown
- `tests/helpers/testDatabase.ts` - Container lifecycle management and database utilities
- `tests/helpers/testFactories.ts` - Test data factories for creating realistic test data
- `tests/auth/login.test.ts` - Tests for login and impersonation workflows

## Usage

### Running Tests with Testcontainers

To run tests with real PostgreSQL containers:

1. **Start Docker daemon** (required for testcontainers)
2. **Run tests**:
   ```bash
   TEST_USE_CONTAINERS=true npm run test
   ```

### Running Tests without Testcontainers

For faster feedback during development (uses existing test mocks):

```bash
# Environment variable not set or set to false
npm run test
```

### Test Configuration

Key vitest configuration for testcontainers:

- `testTimeout: 60000` - 60 seconds for container startup
- `hookTimeout: 120000` - 2 minutes for setup/teardown hooks
- `setupFiles: ["./tests/setup.ts"]` - Global container lifecycle management

### Test Factories

Realistic test data generation:

```typescript
const user = await factory.createUser({
  username: "testuser",
  email: "test@example.com",
});

const competition = await factory.createCompetition({
  name: "Test Competition",
  forecasts_close_date: new Date(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});

const prop = await factory.createCompetitionProp(competition.id);
const forecast = await factory.createForecast(user.id.toString(), prop.id, {
  forecast: 0.75,
});
```

## Troubleshooting

**Container startup issues:**

- Ensure Docker daemon is running
- Check available disk space and memory
- Verify network connectivity for pulling PostgreSQL image
