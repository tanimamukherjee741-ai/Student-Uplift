# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Session-based auth with express-session + bcryptjs
- **Frontend**: React + Vite + TanStack Query + wouter routing + Tailwind CSS

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── edu-earn/           # EduEarn React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: EduEarn

A student productivity and earning website with:
- User authentication (register/login with email+password)
- Dashboard with daily tasks, earning gigs, progress stats
- Task system with ₹ rewards and point tracking (18 tasks seeded)
- Daily challenge feature with bonus rewards (14 challenges seeded)
- Streak system tracking consecutive daily logins
- Weekly & all-time leaderboard
- Profile page with history
- Notification system (toast alerts + notification bell)
- Responsive design with indigo/violet + gold color palette

## Database Schema

- `users` — id, name, email, password_hash, points, streak, last_checkin
- `tasks` — id, title, description, category (study|gig|challenge), reward, points, is_active
- `user_tasks` — junction: user task completions
- `challenges` — daily challenge with reward, bonus_reward, points, bonus_points, date
- `user_challenges` — junction: user challenge completions
- `notifications` — user notifications with type, title, message, read

## API Routes

All routes are under `/api`:
- `GET /healthz` — health check
- `POST /auth/register` — create account
- `POST /auth/login` — login
- `POST /auth/logout` — logout
- `GET /auth/me` — current user
- `GET /tasks?category=` — list tasks with completion status
- `POST /tasks/:id/complete` — complete a task
- `GET /users/profile` — profile with stats
- `GET /users/completed-tasks` — task history
- `POST /users/checkin` — daily check-in / streak update
- `GET /leaderboard?period=weekly|alltime` — leaderboard
- `GET /notifications` — user notifications
- `POST /notifications/:id/read` — mark read
- `POST /notifications/read-all` — mark all read
- `GET /challenges/today` — today's challenge
- `POST /challenges/:id/complete` — complete challenge
- `GET /dashboard/summary` — dashboard stats

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with session-based auth, bcryptjs, express-session.

### `artifacts/edu-earn` (`@workspace/edu-earn`)

React + Vite frontend with Plus Jakarta Sans font, indigo/violet + gold palette.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec and Orval codegen config.

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks.
