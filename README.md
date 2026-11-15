# QueueFlow


A full-stack queue management application for managers to organize service queues, issue tokens, control service flow, and review operational analytics.

## Features

- Manager registration and sign-in with bcrypt password hashing and JWT sessions.
- Manager-owned queues with status control and safe deletion rules.
- Sequential per-queue token numbers, positions, reordering, calling, serving, completion, and cancellation.
- Transactional queue operations to serialize token creation and transitions.
- Real database-backed queue summaries and analytics.
- Responsive Next.js dashboard, queue controls, analytics charts, and account settings.

## Technology

- Backend: Node.js ES modules, Express, PostgreSQL, Sequelize, Joi, JWT, bcryptjs.
- Frontend: Next.js App Router, React, Tailwind CSS, Axios, Recharts, Lucide React.

## Architecture

The backend separates HTTP routes and controllers from service rules and repository persistence. Sequelize models and migrations define the database schema. Input is validated before reaching controllers, and mappers shape token and queue outputs.

Request lifecycle: `Frontend → API Route → Controller → Service → Repository → Model → PostgreSQL`

Response lifecycle: `PostgreSQL → Repository → Service → Mapper → Controller → Frontend`

## Project layout

```text
backend/
  src/config/                 environment and Sequelize setup
  src/database/               Sequelize CLI migration and development seeder
  src/middlewares/            authentication, validation, and error handling
  src/models/                 User, Queue, Token, and relationships
  src/modules/                auth, queues, tokens, and analytics layers
  src/server.js               API process entry point
frontend/
  src/app/                    Next.js routes and page layouts
  src/components/             reusable UI components
  src/context/                manager authentication state
  src/services/               centralized Axios API client
```

## Database relationships

- One manager owns many queues.
- Each queue contains zero or more tokens.
- Tokens have a unique token number within their queue and retain lifecycle timestamps.
- Queue deletion is rejected after tokens have been issued; deactivate a queue to retain its history.

## Requirements

- Node.js 20 or later and npm.
- PostgreSQL 14 or later.

## Setup

1. Create a PostgreSQL database, for example `queue_manager`.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and `FRONTEND_URL`.
3. Copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` if the API is not at `http://localhost:4000/api/v1`.
4. Install dependencies:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

5. Apply the schema and optionally create a development manager:

   ```powershell
   cd backend
   npm run db:migrate
   $env:DEMO_MANAGER_EMAIL = "manager@example.com"
   $env:DEMO_MANAGER_PASSWORD = "choose-a-local-password"
   npm run db:seed
   ```

The seeder requires explicit development credentials and does not create a default production account. Alternatively, register through the application.

## Run locally

Start the backend in one terminal:

```powershell
cd backend
npm run dev
```

Start the frontend in another:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`. The health endpoint is `http://localhost:4000/api/v1/health`.

## API overview

All responses use `{ "success": true|false, "message": "...", "data": ..., "meta": ... }`. Protected endpoints require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a manager |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/logout` | Revoke the manager's sessions |
| GET / PATCH | `/api/v1/auth/me` | Read or update profile |
| PUT | `/api/v1/auth/password` | Change password and revoke sessions |
| GET / POST | `/api/v1/queues` | List or create queues |
| GET / PUT / DELETE | `/api/v1/queues/:queueId` | Read, update, or safely delete a queue |
| PATCH | `/api/v1/queues/:queueId/status` | Activate or deactivate a queue |
| GET / POST | `/api/v1/queues/:queueId/tokens` | List or issue tokens |
| POST | `/api/v1/queues/:queueId/call-next` | Call the next waiting token |
| GET | `/api/v1/tokens/:tokenId` | Read a token |
| PATCH | `/api/v1/tokens/:tokenId/move` | Move a waiting token up or down |
| PATCH | `/api/v1/tokens/:tokenId/start-service` | Start serving a called token |
| PATCH | `/api/v1/tokens/:tokenId/complete` | Complete a serving token |
| PATCH | `/api/v1/tokens/:tokenId/cancel` | Cancel a non-completed token |
| GET | `/api/v1/analytics/{overview,queue-length,token-statistics,waiting-time,token-distribution}` | Read database-backed analytics |

List endpoints support pagination and token status/search/sorting filters. Analytics accepts optional ISO `from` and `to` query parameters.

## Database commands

```powershell
cd backend
npm run db:migrate
npm run db:seed
```

The seeder is intended for development only. Do not set demo credentials in production.

## Tests and production build

```powershell
cd backend
npm test
cd ..\frontend
npm run build
```

The backend test suite includes analytics calculations. Database integration checks require a configured PostgreSQL database and should use a separate test database.

## Deployment

- **Render backend:** set the service root directory to `backend`, build command to `npm ci`, and start command to `npm start`. The server binds to `0.0.0.0` and uses Render's assigned `PORT`.
- **Render environment:** configure `NODE_ENV=production`, Render's `PORT`, the Neon `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, `JWT_EXPIRES_IN=12h`, and `FRONTEND_URL=https://queuemanager-liart.vercel.app`.
- Use Neon’s direct or pooled connection string and set its query parameter to `sslmode=verify-full`. The installed `pg` 8.23.1 / `pg-connection-string` 2.14.1 stack enables TLS and verifies the server certificate for this mode. Production startup rejects local database URLs, missing production settings, and other SSL modes.
- **Migrations:** review the target database and back it up first. Then run `npm run db:migrate` from the backend service shell (or a one-off job) before deploying code that needs the schema. The command uses `.sequelizerc` and `DATABASE_URL`; migrations are deliberately not run automatically during server startup. Check applied migrations with `npx sequelize-cli db:migrate:status`.
- **Vercel frontend:** set `NEXT_PUBLIC_API_URL=https://queue-manager-1.onrender.com/api/v1` for the production deployment, then redeploy. Production builds fail if this variable is missing instead of silently targeting localhost.
- `GET /api/v1/health` is the process liveness check; `GET /api/v1/health/ready` also checks the database. CORS allows the configured `FRONTEND_URL`; `http://localhost:3000` is allowed only in development.
- Generate a JWT secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Never commit `.env` files or put credentials in the frontend.

## Live Link
https://queuemanager-liart.vercel.app/

