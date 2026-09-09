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
npm run verify:api
npm run verify:planner
npm run setup:question-storage
npm run verify:questions
npm run verify:tests
npm run verify:attempts
npm run verify:scoring
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

The migration is under `supabase/migrations/`; `supabase/seed.sql` is the reproducible seed, and `server/src/types/database.types.ts` is generated from the resulting PostgreSQL schema. `npm run validate:seed` checks the local canonical seed without database credentials; `npm run verify:db` performs read-only verification against the configured dedicated project. V1.1 was manually applied from these version-controlled SQL artifacts through the Supabase SQL Editor because CLI account authentication was unavailable; the migration file remains the schema source of truth.

## V1.2 backend APIs

V1.2 adds the local server data path: Express routes → strict Zod validation → services → repositories → server-only Supabase. The foundational APIs are `GET/PATCH /api/settings`, `GET /api/syllabus`, and `PATCH /api/topics/:topicId/status`. `npm run verify:api` exercises these APIs against the configured database, restores its temporary settings/topic updates in `finally`, and verifies invalid requests are rejected. No frontend feature, public deployment, or database schema migration is included.

## V1.3 syllabus tracker

The `/syllabus` route now renders the backend-powered official GATE 2027 hierarchy with expandable subjects and persistent topic-status controls. Mobile and tablet retain touch-friendly bottom navigation, while layouts from 1024px use a persistent sidebar and a readable maximum content width. Loading, controlled failure, Retry, per-topic saving, and safe mutation-error states are handled locally without exposing Supabase credentials to the browser.

## V1.4 dashboard and settings

Home now shows the saved exam and calendar-day countdown, target marks, the local-day study-hours target, and factual topic-status counts from the full syllabus hierarchy. `/settings`, linked from More, provides a validated persistent form for the existing settings contract; it sends only changed mutable fields and preserves unsaved input after failures. These real screens are visible through the established local development command with no new backend API or database migration.

## V1.5 daily study planner

The `/plan` route provides date-based task CRUD using the existing `daily_tasks` table, real syllabus-linked subject/topic selectors, persistent TODO/Done/Skipped state, manual actual minutes, and one server-authoritative running timer. Timer starts survive refresh, only completed whole minutes (floor rounding) accumulate on Stop, and only one timer can run globally. Sub-minute stops add zero; a runaway timer is safely stopped with a correction conflict rather than writing invalid time. `npm run verify:planner` validates the six planner endpoints, strict input handling, status/timer semantics (including concurrent starts and runaway recovery), and complete cleanup of temporary verification rows.

## V1.6 question bank

The `/questions` route provides a server-backed Question Bank for MCQ, MSQ, and NAT questions using the existing question schema. It includes syllabus-aware subject/topic selection, canonical answers, pagination and filters, editing, archive/restore, and one optional private image per question. Images are validated and served only through the backend; run `npm run setup:question-storage` to idempotently configure the private `question-images` bucket. `npm run verify:questions` exercises validation, CRUD transitions, filtering, private image lifecycle, and complete temporary-data cleanup. Open `http://localhost:4173/questions` while the local development servers are running.

## V1.7 test creation

The `/test` library and `/tests/new` builder create saved Topic Tests, mixed Custom Tests, and manually composed GATE Full Mock definitions. Question selection is explicit and ordered, while total marks and contiguous positions are assigned from canonical database rows by the server. Full Mocks enforce the 65-question, 100-mark, 180-minute GA/Engineering Mathematics/Core CS structure without inventing per-subject distributions. Unused tests can be edited or deleted; a test becomes immutable after its first attempt, and questions used by attempted tests protect their content and image while still allowing archive/restore. `npm run verify:tests` exercises the real API, official domain rules, locks, answer-free payloads, ordering, and complete cleanup.

## V1.8 test engine

Saved tests support Start, Continue, and fresh Retake flows. The focused exam route handles MCQ, MSQ, and NAT responses, Clear Answer, Mark for Review, question navigation, a responsive palette, private question images, and failure-aware autosave. Its countdown and manual/automatic submission are server-authoritative: leaving or refreshing never pauses the deadline, while persisted answers, review flags, and per-question time restore on Continue. `npm run verify:attempts` exercises the real API and database contracts, safety boundaries, expiry, submission, retake behavior, and complete temporary-data cleanup.

## V1.9 scoring engine

Submitted attempts are scored authoritatively on the server. MCQs use official one-third negative marking, MSQs require exact-set equality with no partial or negative marks, and NAT answers use inclusive numeric ranges. The engine aggregates exact integer third-mark units and rounds the raw attempt score only once; it does not clamp negative totals. `npm run verify:scoring` covers pure domain rules and real submission, persistence, retry, integrity, privacy, and cleanup behavior. Results remain intentionally hidden from the exam UI; the Results and Mistakes experience begins in V1.10.
