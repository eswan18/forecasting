# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js forecasting application inspired by Philip Tetlock's Good Judgment Project. Users can predict the likelihood of events happening and compete in tournaments. The app includes user authentication, forecast tracking, competitions, and scoring.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run lint` - Run ESLint
- `npm run start` - Start production server

### Testing
- `npm run test` - Run all unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook

**Testing Setup:**
- Unit tests use Vitest with Node.js environment
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
- **Tables**: users, forecasts, props, competitions, categories, resolutions, feature_flags
- **Views**: Prefixed with `v_` (e.g., `v_forecasts`, `v_props`) for complex queries with joins

### Server Actions Pattern
This codebase follows a specific server action pattern documented in `/docs/server-actions-best-practices.md`:
- All server actions return `ServerActionResult<T>` type instead of throwing errors
- Use helper functions: `success()`, `error()`, `validationError()`
- Database actions are in `/lib/db_actions/` organized by entity
- Client components use `useServerAction` hook for loading states and error handling

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
3. Add required env vars: `JWT_SECRET`, `ARGON2_SALT`, `MAILGUN_API_KEY`
4. Run `npm run dev`

### UI Framework
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui component library in `/components/ui/`
- **Theming**: Dark/light mode support via next-themes
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for score visualization

### Error Monitoring
- Sentry integration for error tracking and performance monitoring
- Vercel Analytics for usage tracking