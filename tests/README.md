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

### Test Coverage

**Core Database Actions:**
- `tests/db_actions/users.test.ts` - User CRUD operations and authorization
- `tests/db_actions/forecasts.test.ts` - Forecast management and business logic
- `tests/db_actions/competitions.test.ts` - Competition operations
- `tests/db_actions/props.test.ts` - Proposition handling and filtering

**Authentication & Authorization:**
- `tests/auth/login.test.ts` - Login and impersonation workflows
- `tests/auth/register.test.ts` - User registration and invite token validation

## Usage

### Running Tests with Testcontainers

To run tests with real PostgreSQL containers:

1. **Start Docker daemon** (required for testcontainers)
2. **Set environment variable**:
   ```bash
   export TEST_USE_CONTAINERS=true
   ```
3. **Run tests**:
   ```bash
   npm run test
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

## Features Tested

### Database Actions

- **User Management**: CRUD operations, duplicate email handling, authorization checks
- **Forecasts**: Creation, validation, due date enforcement, filtering
- **Competitions**: Admin-only operations, lifecycle management
- **Props**: Complex filtering, RLS enforcement, competition association

### Authentication

- **Login**: Password verification, JWT token creation, session management
- **Impersonation**: Admin-only user impersonation for support workflows  
- **Registration**: User creation, invite token validation, password requirements

### Business Logic

- **Authorization**: RLS policies, admin-only operations, user ownership
- **Data Integrity**: Foreign key constraints, unique constraints, validation
- **Scoring**: Brier score calculations with real forecast data
- **Competition Logic**: Due date enforcement, enrollment management

## Benefits

### Real Database Behavior

- Tests catch SQL-specific issues that mocks miss
- RLS policies are properly validated
- Migration compatibility is verified
- Performance characteristics are realistic

### Test Reliability

- No more brittle mocks that drift from implementation
- Database constraints are enforced during tests
- Concurrent access patterns can be tested
- Real transaction behavior is validated

### Developer Experience

- Tests provide confidence in database schema changes
- Easy to debug with real SQL queries and data
- Integration tests catch cross-module issues
- Production-like testing environment

## Implementation Details

### Container Management

- PostgreSQL 16 Alpine containers for fast startup
- Automatic migration running on container start
- Proper cleanup after test suites complete
- Test data isolation between test cases

### Test Factories

Realistic test data generation:

```typescript
const user = await factory.createUser({
  username: "testuser",
  email: "test@example.com"
});

const competition = await factory.createCompetition({
  name: "Test Competition",
  start_date: new Date(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
});

const prop = await factory.createCompetitionProp(competition.id);
const forecast = await factory.createForecast(user.id, prop.id, { 
  probability: 0.75 
});
```

### Mock Strategy

Strategic mocking preserves test speed while enabling database testing:

- User session mocking for authentication context
- Cache revalidation mocking (not testing Next.js internals)
- Logger mocking to reduce test noise
- Environment variable mocking for consistent test conditions

## Future Enhancements

Potential areas for expansion:

1. **Performance Testing**: Use containers for load testing database operations
2. **Migration Testing**: Automated testing of migration rollbacks and schema changes  
3. **Concurrent Testing**: Multi-user scenarios and race condition testing
4. **Data Migration**: Testing of data transformation scripts
5. **Backup/Restore**: Testing of database backup and recovery procedures

## Troubleshooting

**Container startup issues:**
- Ensure Docker daemon is running
- Check available disk space and memory
- Verify network connectivity for pulling PostgreSQL image

**Test timeouts:**
- Increase timeouts in vitest.config.ts if needed
- Check for hanging database connections
- Monitor container resource usage

**Mock issues:**
- Ensure mocks are set up before importing tested modules
- Use vi.clearAllMocks() in beforeEach hooks
- Check for mock leakage between test files