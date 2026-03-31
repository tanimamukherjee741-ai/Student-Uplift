# EduEarn — Student Productivity & Earning Platform

## Overview
Full-featured student productivity web app where students complete study tasks and small gigs to earn rupee rewards (₹). Features gamification (streaks, leaderboard, daily challenges), a study time tracker, tutor finder, internship board, and a class stream competition system.

## Architecture

- **Frontend**: React + Vite (`artifacts/edu-earn`) — port from `PORT` env var
- **Backend**: Express.js API server (`artifacts/api-server`) — port 8080
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **API Contract**: OpenAPI spec in `lib/api-spec/openapi.yaml`; React Query hooks generated via Orval into `lib/api-client-react`

## User Roles
- `student` — default, can complete tasks/challenges, track study time, join streams
- `teacher` — can post tutor listings (visible on /find-tutors)
- `employer` — can post internship/job listings (visible on /internships)

## Pages & Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | Login | No |
| `/register` | Register (with role selector) | No |
| `/dashboard` | Student dashboard with summary stats | Yes |
| `/tasks` | Task list with earn ₹ | Yes |
| `/leaderboard` | Global + stream leaderboard | Yes |
| `/profile` | User profile with stats | Yes |
| `/find-tutors` | Tutor & coaching finder (search by city/subject) | Yes |
| `/internships` | Internships, part-time, freelance listings | Yes |
| `/study-tracker` | Study timer + 7-day history chart | Yes |
| `/streams` | Join class stream, see classmates leaderboard | Yes |
| `/teacher-dashboard` | Post/manage tutor or internship listings | Yes (teacher/employer) |

## Database Schema

Tables in `lib/db/src/schema/`:
- `users` — id, name, email, passwordHash, role, points, streak, stream, city, lastCheckin, createdAt
- `tasks` — tasks with points and ₹ rewards
- `user_tasks` — task completion records
- `challenges` — daily challenges
- `user_challenges` — challenge completion records
- `notifications` — user notifications
- `tutor_listings` — tutor/coaching listings posted by teachers
- `internship_listings` — internship/job listings posted by employers
- `study_sessions` — study timer session logs

## API Routes

Backend routes in `artifacts/api-server/src/routes/`:
- `auth.ts` — /auth/register, /auth/login, /auth/logout, /auth/me (role-aware)
- `tasks.ts` — /tasks, /tasks/:id/complete
- `users.ts` — /users/profile, /users/completed-tasks, /users/checkin
- `leaderboard.ts` — /leaderboard
- `notifications.ts` — /notifications, /notifications/:id/read, /notifications/read-all
- `challenges.ts` — /challenges/today, /challenges/:id/complete
- `dashboard.ts` — /dashboard/summary (includes study minutes + stream name)
- `tutors.ts` — GET /tutors, POST /tutors, DELETE /tutors/:id, GET /tutors/my-listings
- `internships.ts` — GET /internships, POST /internships, DELETE /internships/:id, GET /internships/my-listings
- `streams.ts` — GET /streams, POST /users/join-stream, GET /streams/:stream/members, GET /leaderboard/stream
- `study.ts` — POST /study/sessions, GET /study/today, GET /study/history

## Key Technical Decisions
- `bcryptjs` (pure JS) for password hashing (avoids native build issues)
- `express-session` with 7-day cookie
- Orval codegen for React Query hooks from OpenAPI spec
- Recharts for study history bar chart
- Daily study goal: 120 minutes (2 hours)
- Google Fonts `@import` must be FIRST line in index.css

## Seed Data
- 18 tasks (study + gig categories)
- 14 daily challenges
- 6 tutor listings
- 6 internship listings
- Sample teacher account: teacher@eduearn.in / password123
- Sample employer account: employer@eduearn.in / password123

## Development Commands
```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/edu-earn run dev

# Push DB schema changes
pnpm --filter @workspace/db run push

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```
