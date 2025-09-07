# Testcontainers Implementation Plan

**Note: This is a future project - not immediate priority**

## Overview

Plan to implement comprehensive server function testing using testcontainers for real PostgreSQL database testing.

## Why Testcontainers is Perfect for This Project

- **PostgreSQL Integration**: Your app uses PostgreSQL with Kysely - testcontainers can spin up real PostgreSQL instances
- **Database Actions Testing**: You have extensive `lib/db_actions/` modules that need real database testing
- **Server Actions**: Your server action pattern with `ServerActionResult<T>` can be thoroughly tested
- **Isolation**: Each test gets a clean database instance

## Implementation Plan

### Phase 1: Setup & Dependencies

1. **Install testcontainers**: `npm install --save-dev @testcontainers/postgresql @testcontainers/testcontainers`
2. **Update vitest config** to support async setup/teardown
3. **Create test database utilities** for connection management

### Phase 2: Test Infrastructure

1. **Create test helpers**:
   - Database container setup/teardown functions
   - Test data factories for seeding
   - Database migration runner for tests
2. **Configure separate test database** connection logic
3. **Setup beforeAll/afterAll** hooks for container lifecycle

### Phase 3: High-Value Test Targets

**Priority 1 - Core Database Actions:**

- `lib/db_actions/users.ts` - User CRUD operations
- `lib/db_actions/forecasts.ts` - Forecast management
- `lib/db_actions/competitions.ts` - Competition logic
- `lib/db_actions/props.ts` - Proposition handling

**Priority 2 - Authentication & Authorization:**

- `lib/auth/` modules with real database state
- User session management
- RLS policy validation

**Priority 3 - Complex Business Logic:**

- Scoring calculations with real data
- Competition enrollment/participation flows
- Forecast aggregation and statistics

### Phase 4: Advanced Testing

1. **Integration tests** for complete user workflows
2. **Performance tests** with realistic data volumes
3. **Migration testing** to ensure database schema changes work

## Benefits You'll Gain

- **Real database behavior** vs mocks
- **Schema validation** catches migration issues
- **Concurrent test safety** with isolated containers
- **Production-like testing** environment
- **RLS policy testing** with actual PostgreSQL

## Current State

- Vitest already configured for unit tests
- Existing test files: auth, database actions, server utilities
- PostgreSQL database with Kysely query builder
- Server action pattern with `ServerActionResult<T>`
