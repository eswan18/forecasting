# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js forecasting application inspired by Philip Tetlock's Good Judgment Project. Users can predict the likelihood of events happening and compete in tournaments. The app includes user authentication, forecast tracking, competitions, and scoring.

## Development Commands

### Essential Commands

- `ENV=local npm run dev` - Start development server with local environment
- `ENV=dev npm run dev` - Start development server with dev environment
- `ENV=prod npm run dev` - Start development server with production environment
- `npm run build` - Build production application
- `npm run lint` - Run ESLint
- `npm run start` - Start production server

### Testing

- `npm run test` - Run all unit tests with Vitest
- `npm run test:containers` - Run tests with real PostgreSQL containers (requires Docker, ~3-5min first run)
- `npm run test:containers:quick` - Quick container test verification (single test file)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook

**Testing Setup:**

- Unit tests use Vitest with Node.js environment
- **Gotcha**: Importing components that transitively import `lib/database.ts` will fail in unit tests (requires `DATABASE_URL`). Extract pure logic (e.g., Zod schemas) into separate files for testability.
- Testcontainers integration available for database testing with real PostgreSQL instances
- Test files: `**/*.{test,spec}.{ts,tsx}`
- Coverage provided by V8 with HTML/JSON/text reports
- UI components tested in Storybook (excluded from coverage)
- Existing test files cover auth, database actions, server utilities

### Database Migrations

- `npm exec kysely migrate make <migration-description>` - Create new migration
- `DATABASE_URL='...' npm exec kysely migrate up` - Run migrations

## Code Architecture

### Database Layer

- **Database**: PostgreSQL with Kysely query builder
- **Connection**: `/lib/database.ts` exports `db` instance
- **Types**: `/types/db_types.ts` contains all database types and table definitions
- **Tables**: users, forecasts, props, competitions, categories, resolutions, feature_flags, competition_members (roles: `admin`/`forecaster`)
- **Views**: Prefixed with `v_` (e.g., `v_forecasts`, `v_props`) for complex queries with joins

### Server Actions Pattern

This codebase follows a structured server action pattern that returns results instead of throwing errors. **See `/docs/server-actions-best-practices.md` for complete documentation and examples.**

- Server actions return `ServerActionResult<T>` — either `success(data)` or `error(message, code)`
- Use `withRLS(userId, async (trx) => ...)` from `/lib/db-helpers.ts` for queries needing Row Level Security
- Client components consume server actions via the `useServerAction` hook from `/hooks/use-server-action.ts`

### Authentication & Authorization

- JWT-based auth with cookies
- Password hashing with Argon2
- User sessions managed via `/lib/auth/` modules
- RLS (Row Level Security) enabled on key tables

### App Structure (Next.js App Router)

- **App Pages**: `/app/` directory with route-based structure
- **Components**: `/components/` with ui/ subfolder for shadcn/ui components
- **Layouts**: Nested layouts for admin, competitions, standalone views
- **Server Components**: Most pages are server components fetching data directly

### Key Features

- **Competitions**: Time-bound forecasting tournaments
- **Props**: Prediction statements that users forecast on
- **Forecasts**: User predictions with probability scores
- **Scoring**: Brier score calculation for forecast accuracy
- **Admin Panel**: User management, competition creation, feature flags
- **Personal Props**: Users can create private propositions

### Local Development Setup

1. Spin up local PostgreSQL: `docker compose --env-file .env.prod -f local-pg-container.yaml up`
2. Set `DATABASE_URL='postgresql://ethan:ethan@localhost:2345/forecasting'` in `.env.local`
3. Add required env vars: `JWT_SECRET`, `ARGON2_SALT`
4. Run `ENV=local npm run dev`

### Environment Management

The app supports multiple environments with automatic configuration loading:

- **Local**: `ENV=local npm run dev` - Uses `.env.local` (blue banner)
- **Development**: `ENV=dev npm run dev` - Uses `.env.dev` (yellow banner)
- **Production**: `ENV=prod npm run dev` - Uses `.env.prod` (no banner)

Environment variables are loaded at startup via `instrumentation.ts` and the appropriate `.env` file is automatically selected. A colored banner at the top of the page indicates which environment is currently running.

### UI Framework

- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui component library in `/components/ui/`
- **Theming**: Dark/light mode support via next-themes
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for score visualization

### Error Monitoring

- Sentry integration for error tracking and performance monitoring
