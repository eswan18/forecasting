# Forecasting App

This is a web application for predicting the likelihood that certain events will happen in the coming year.
Check it out at [forecasting.ethanswan.com](https://forecasting.ethanswan.com).

The idea is inspired by Philip Tetlock's [Good Judgment Project](https://en.wikipedia.org/wiki/The_Good_Judgment_Project) and book _Superforecasting_.

## What's in here?

A NextJS app and database migrations, basically.

## How is it deployed?

In Vercel, with minimal customization.

## DB Schema

![Schema Diagram](docs/schema.png)

## Development Tips

### How do I run it locally?

Before running a local instance, you'll need a local copy of the database as well.
The below line spins up a postgres container with a copy of the prod database, as it exists at the time of startup.
It relies on you having a defined `DATABASE_URL` (with read access to the prod database) in your `.env.prod`.

```bash
docker compose --env-file .env.prod -f local-pg-container.yaml up
```

Then, you can tell your local instance to use the local database copy by updating `.env.local` and adding this line:

```bash
DATABASE_URL='postgresql://ethan:ethan@localhost:2345/forecasting'
```

Last, you'll need a few other variables in your `.env.local`.

```bash
# This is used to encrypt JWTs. For local dev, it can be anything.
JWT_SECRET='whocares'

# This will need to match the prod salt if you want to be able to log in as a preexisting user.
# But if not, you can make something up.
ARGON2_SALT='ask-ethan'

# If you want to test email functionality, you'll need to get one of these.
MAILGUN_API_KEY='abcxyz'
```

Now, you can launch a fully-functional dev instance.

```bash
npm run dev
```

### Testing

This project uses Vitest for testing with support for both unit tests and integration tests using real PostgreSQL databases via Testcontainers.

#### Running Tests

**Unit tests (no database):**

```bash
npm run test
```

**Integration tests with real database (requires Docker):**

```bash
npm run test:containers
```

**Quick container test verification:**

```bash
npm run test:containers:quick
```

#### Testcontainers Setup

The project uses [Testcontainers](https://testcontainers.com/) to provide real PostgreSQL instances for database integration tests. This ensures tests run against the same database engine as production.

**Requirements:**

- Docker Desktop or Docker daemon running
- Docker accessible from your user account

**How it works:**

1. **Global container**: Single PostgreSQL container shared across all test files
2. **Real migrations**: Runs all database migrations on startup
3. **Test isolation**: Data cleanup between tests while preserving seed data
4. **Sequential execution**: Tests run sequentially to prevent database conflicts
5. **Auto-cleanup**: Container is destroyed after tests complete

**Features:**

- ✅ Real PostgreSQL 16 database (matches production)
- ✅ Full migration suite applied automatically
- ✅ Proper password hashing and authentication testing
- ✅ Test data factories for creating users, forecasts, competitions
- ✅ Foreign key constraint validation
- ✅ Seed data preservation (admin user, categories, competitions)

**Container Configuration:**

```typescript
// Automatic setup - no manual configuration needed
Database: test_forecasting
User: test_user
Password: test_password
Port: Auto-assigned (5432 inside container)
```

**Test Structure:**

```
tests/
├── helpers/
│   ├── testDatabase.ts      # Database connection and cleanup
│   └── testFactories.ts     # Data factories for test objects
├── db_actions/             # Database action tests
├── auth/                   # Authentication flow tests
└── integration/            # Cross-component integration tests
```

**Troubleshooting:**

If container tests fail to start:

```bash
# Check Docker is running
docker ps

# If permission denied:
# Make sure your user is in the docker group (Linux)
# or Docker Desktop is running (Mac/Windows)

# Run without containers as fallback:
npm run test
```

**Performance:**

- First run: ~3-5 minutes (downloads PostgreSQL image)
- Subsequent runs: ~4-5 seconds (reuses container setup)
- 106 tests covering full authentication and database operations

### Migrations

#### How do I make a new migration?

Create a migration with a relatively descriptive name, which will be embedded in the filename.
For consistency, use dashes instead of underscores or spaces.

```bash
npm exec kysely migrate make <migration-description>
```

#### How do I run new migrations?

Obviously it's best to do this in the staging DB and make sure all is well before going to prod.

```bash
DATABASE_URL='...' npm exec kysely migrate up
```
