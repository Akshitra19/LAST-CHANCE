# LAST CHANCE

LAST CHANCE is a single-user, mobile-first PWA foundation for personal GATE 2027 Computer Science preparation.

## Architecture

- `client`: React, Vite, TypeScript, React Router, responsive CSS, and `vite-plugin-pwa`
- `server`: Node.js, Express, TypeScript, and server-only Supabase access
- npm workspaces coordinate both applications from the repository root

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- A Supabase project is optional for the V1.0 shell; credentials are required only to verify connectivity

## Installation

```bash
npm install
```

## Environment setup

Copy `server/.env.example` to `server/.env`, then provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep `server/.env` local; it is ignored by Git. If these values are absent, the health endpoint reports Supabase as unconfigured instead of claiming a successful connection.

`CLIENT_ORIGIN` controls the allowed browser origin for the API. `VITE_API_BASE_URL` may optionally be set for the client; local development uses the Vite `/api` proxy by default.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
```

`npm run dev` starts the frontend and backend together. The frontend is served at `http://localhost:4173`, and the API health endpoint is `http://localhost:3000/api/health`.

## Repository structure

```text
client/   React PWA shell
server/   Express API and server-only Supabase client
```

## V1.0 scope

V1.0 contains only the application shell, placeholder routes, health endpoint, secure Supabase connectivity scaffold, and PWA build foundation. It creates no database tables, authentication, study features, analytics, or fake study data.

V1.1 has NOT been implemented.
