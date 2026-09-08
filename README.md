# LAST CHANCE

LAST CHANCE is a single-user responsive PWA for personal GATE 2027 Computer Science preparation.

## Architecture

- `client`: React, Vite, TypeScript, React Router, responsive CSS, and `vite-plugin-pwa`
- `server`: Node.js, Express, TypeScript, and server-only Supabase access
- npm workspaces coordinate both applications from the repository root

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- A dedicated Supabase project for LAST CHANCE

## Installation

```bash
npm install
```

## Environment setup

Copy `server/.env.example` to `server/.env`, then provide `SUPABASE_URL` and the modern `SUPABASE_SECRET_KEY` (`sb_secret_...`). Keep `server/.env` local; it is ignored by Git. The secret is server-only and must never use a `VITE_` prefix. If configuration is absent, health reports Supabase as unconfigured.

`CLIENT_ORIGIN` controls the allowed browser origin for the API. `VITE_API_BASE_URL` may optionally be set for the client; local development uses the Vite `/api` proxy by default.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run validate:seed
npm run verify:db
```

`npm run dev` starts the frontend and backend together. Open `http://localhost:4173`; do not open `client/dist/index.html` directly because Vite/PWA assets require an HTTP origin. API health is available at `http://localhost:3000/api/health`.

## Repository structure

```text
client/   React PWA shell
server/   Express API and server-only Supabase client
supabase/ Versioned PostgreSQL migration and idempotent official syllabus seed
```

## V1.1 database foundation

V1.1 defines ten application tables with constraints, deliberate foreign-key behavior, indexes, RLS, and browser-role privilege revocation. The idempotent seed contains the official GATE 2027 CS and General Aptitude syllabus from IIT Madras (11 subjects and 173 normalized topics). It preserves future user-edited app settings and topic progress on rerun.

The migration is under `supabase/migrations/`; `supabase/seed.sql` is the reproducible seed, and `server/src/types/database.types.ts` is generated from the resulting PostgreSQL schema. `npm run validate:seed` checks the local canonical seed without database credentials; `npm run verify:db` performs read-only verification against the configured dedicated project. V1.1 was manually applied from these version-controlled SQL artifacts through the Supabase SQL Editor because CLI account authentication was unavailable; the migration file remains the schema source of truth. No authentication, storage, CRUD APIs, or V1.2 study features are included.
