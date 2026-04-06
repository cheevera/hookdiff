# hookdiff — Requirements Document

## Overview

`hookdiff` is a local developer tool for capturing, inspecting, and diffing incoming webhook requests. It is inspired by webhook.site but adds a core differentiator: structured JSON diff and field-level value tracking across multiple captured requests. The initial version is scoped for personal local use, with the architecture designed to support public deployment and user accounts in the future.

---

## Progress

At-a-glance status of every implementation unit. This list is the single source of truth for tracking progress. The per-step sections below remain the detailed spec.

**Update policy**: steps with sub-checkboxes update incrementally as each sub-unit is committed. The top-level step checkbox is only marked when all sub-items are complete.

### Development Environment

- [x] Frontend Dockerfile
- [x] Root docker-compose.yml
- [x] Devcontainer config
- [x] .env.example

### Phase 1: Frontend with mocked APIs

- Step 1.1 — Project scaffold
  - [x] Scaffold Vite + React + TypeScript project with pnpm
  - [x] Install and configure Tailwind
  - [x] Install and configure Vitest
  - [x] Install and configure @testing-library/react
  - [x] Install and configure Biome (lint + format)
  - [x] Install and configure MSW
  - [x] Install and configure React Router
  - [x] Install and configure React Query
  - [x] Add a single smoke test that renders <App /> without crashing
- [x] Step 1.2 — Static shell with hardcoded endpoint URL
- [x] Step 1.3 — Endpoint creation flow with MSW
- [x] Step 1.4 — Request list from MSW
- [x] Step 1.5 — Real-time updates with a mock WebSocket
- [x] Step 1.6 — Request deletion
- [x] Step 1.7 — Detail panel polish

### Phase 2: Backend, connect frontend

- [x] Step 2.1 — Django project scaffold
- [ ] Step 2.2 — Data models and migrations
- [ ] Step 2.3 — Endpoint creation API
- [ ] Step 2.4 — Request listing API
- [ ] Step 2.5 — Webhook receiver
- [ ] Step 2.6 — Request deletion API
- [ ] Step 2.7 — WebSocket consumer

### Phase 3: Diff feature

- [ ] Step 3.1 — Diff algorithm
- [ ] Step 3.2 — Diff view

---

## Goals

- Provide a clean, fast way to capture and inspect incoming webhook payloads during local development
- Make it easy to compare JSON bodies across multiple captured requests to spot value changes
- Showcase full-stack engineering across Django REST Framework, React/TypeScript, WebSockets, and PostgreSQL
- Maintain 100% unit test coverage on both frontend and backend

---

## Non-Goals (v1)

- User accounts or authentication
- Public deployment
- Support for non-JSON request bodies
- Endpoint expiry or request limits
- Request replay or forwarding
- Endpoint history or switching between previously created endpoints (see Future Considerations)

---

## Stack

### Backend

| Layer | Technology | Notes |
|---|---|---|
| Framework | Django + Django REST Framework | |
| ASGI Server | Daphne | Official Django Channels ASGI server |
| Database | PostgreSQL 16 (alpine image) | |
| Real-time | Django Channels + Redis 7 | WebSocket pub/sub |
| Dependency management | uv + pyproject.toml | Modern Python tooling, generates uv.lock |
| Testing | pytest + pytest-cov | 100% coverage gate via --cov-fail-under=100 |
| Linting | Ruff | Lint and format |
| Containerization | Docker + Docker Compose | |

### Frontend

| Layer | Technology | Notes |
|---|---|---|
| Framework | React + TypeScript | |
| Build tool | Vite | SPA, handles dev server routing |
| Routing | React Router | Clean path routing, e.g. `/a3f9bc2d` |
| Styling | Tailwind CSS | |
| Data fetching | TanStack React Query | |
| Mocking | MSW (Mock Service Worker) | Network-level interception, used in both dev and tests |
| Syntax highlighting | Shiki | VS Code engine, native light/dark theme support |
| Toast notifications | Sonner | Lightweight, Tailwind-compatible |
| Package manager | pnpm | Faster, stricter, better monorepo support |
| Testing | Vitest + @testing-library/react | Behavior-focused component testing |
| Lint + format | Biome | Single tool replacing Prettier + ESLint. Covers React hook rules. |

---

## Repository Structure

Single monorepo with frontend and backend as sibling directories:

```
hookdiff/
├── .devcontainer/
│   ├── devcontainer.json
│   └── docker-compose.yml
├── backend/
│   ├── manage.py
│   ├── hookdiff/          # Django project
│   ├── endpoints/         # Django app
│   ├── pyproject.toml     # Dependencies, Ruff config, pytest config
│   ├── uv.lock
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── Dockerfile
├── .env.example
└── docker-compose.yml
```

---

## Development Environment

### Devcontainer

The project uses a VS Code devcontainer that provides a fully configured development environment with zero manual setup. Opening the repo in VS Code and clicking "Reopen in Container" is the entire setup process.

The devcontainer references the same `docker-compose.yml` used for local development and:

- Installs all Python dependencies via `uv sync` automatically on container creation
- Installs all Node dependencies via `pnpm install` automatically on container creation
- Runs database migrations on first start
- Forwards all relevant ports (Django on 8000, React dev server on 5173, PostgreSQL on 5432)
- Installs recommended VS Code extensions: Python, Pylance, ESLint, Prettier, Tailwind CSS IntelliSense, Docker
- Configures VS Code launch configs for simultaneous Django and React debugging

### Services (docker-compose)

| Service | Port | Notes |
|---|---|---|
| django | 8000 | Daphne ASGI server with hot reload |
| frontend | 5173 | Vite dev server with hot reload |
| postgres | 5432 | postgres:16-alpine |
| redis | 6379 | redis:7-alpine, used by Django Channels |

### Environment Variables

Managed via `.env` file. A committed `.env.example` documents all required variables. No secrets are committed.

### Pre-commit Hooks

- Ruff (lint + format) on all Python files
- Biome (lint + format) on all TypeScript/TSX/JSON/CSS files

### Current state

The root `docker-compose.yml` orchestrates the app (Node + Python), Postgres, and Redis. The `.devcontainer/docker-compose.yml` is a thin override that adds `sleep infinity`, bind mounts, and the working directory. The devcontainer uses `.devcontainer/Dockerfile` which includes Node, pnpm, Python, and uv. The only supported way to run the project is "reopen in devcontainer, then `make dev`".

---

## Implementation Plan

Each feature follows the same pattern: build the frontend against mocked APIs first, then implement the backend, then connect them. Every step below leaves the app in a fully runnable state. Steps are vertical slices: each one delivers a visible, working piece of behaviour rather than an isolated layer.

---

### Phase 1: Frontend with mocked APIs

#### Step 1.1 — Project scaffold

Set up the frontend project with all tooling configured and a passing test suite, but no real UI yet.

- Scaffold Vite + React + TypeScript project with pnpm
- Install and configure Tailwind, React Router, React Query, MSW, Vitest, @testing-library/react, Prettier, ESLint
- Configure Vite dev server to serve `index.html` for all unknown paths (required for clean path routing)
- Add a single smoke test that renders `<App />` without crashing
- App renders a blank page at this point; that is fine

_Watch out for: Tailwind v4 changed its config format significantly. Confirm which version you're installing and follow the matching setup docs._

#### Step 1.2 — Static shell with hardcoded endpoint URL

Deliver the full app layout with hardcoded data so the visual structure is locked in before any logic is wired up.

- Build the app shell: header with a hardcoded endpoint URL and copy button, left sidebar, right panel
- Sidebar shows two or three hardcoded request entries
- Right panel shows a hardcoded request detail with a pretty-printed JSON body via Shiki
- Light/dark toggle wired to localStorage and Tailwind's `dark:` variant; Shiki theme switches to match
- Sonner toast fires on copy button click
- Tests: layout renders, copy button shows toast, light/dark toggle persists to localStorage

_Watch out for: Shiki is async by default. You will need to initialise the highlighter once and share the instance rather than calling `getHighlighter` on every render._

#### Step 1.3 — Endpoint creation flow with MSW

Replace the hardcoded endpoint URL with a real creation flow backed by an MSW handler.

- Define the `POST /api/endpoints/` response shape and add the MSW handler
- On load, check localStorage for an existing slug; if none, call the API and persist the returned slug
- Show a loading state while creation is in progress
- Slug is reflected in the URL via React Router (navigate to `/{slug}` after creation)
- Navigating directly to `/{slug}` loads that endpoint without creating a new one
- "New Endpoint" button clears localStorage, creates a new endpoint, and navigates to the new slug
- Tests: loading state shown on first load, slug persisted to localStorage, navigation to existing slug skips creation, new endpoint button replaces slug

_Watch out for: React Router and React Query can both trigger effects on mount; be deliberate about where the "do I have a slug?" check lives to avoid double-creating endpoints._

#### Step 1.4 — Request list from MSW

Replace the hardcoded sidebar entries with a real request list backed by an MSW handler.

- Define the `GET /api/endpoints/{slug}/requests/` response shape and add the MSW handler
- Fetch and render the request list using React Query
- Each sidebar entry shows method badge, timestamp, and truncated body preview
- Sidebar header shows request count and last-received timestamp
- Clicking an entry selects it and shows its detail in the right panel
- Empty state shown when the list is empty
- Tests: request list renders from MSW data, empty state renders, selecting a request updates the right panel

_Watch out for: the truncated body preview should be a single line regardless of JSON structure. Decide on a character limit here and encode it as a constant._

#### Step 1.5 — Real-time updates with a mock WebSocket

Wire up real-time behaviour using a mock WebSocket that fires fake requests on a timer, so the live update flow can be fully built and tested before the backend exists.

- Implement a `useWebSocket` hook that connects to `ws://localhost:8000/ws/endpoints/{slug}/` and appends incoming requests to the React Query cache
- In development, swap the real WebSocket for a mock that emits a fake request every few seconds
- New requests appear at the top of the sidebar in real time
- Pinning behaviour: selecting any request pins it; new arrivals show a "N new request(s)" badge without switching the panel
- "Jump to latest" button appears when not viewing the most recent request
- Connection status indicator visible in development only
- Tests: incoming WebSocket message appends to the list, pinning prevents auto-switch, badge count increments correctly, jump to latest clears the pin

_Watch out for: React Query cache updates from outside a query fetcher need to use `queryClient.setQueryData`. Keep the WebSocket hook decoupled from the sidebar component._

#### Step 1.6 — Request deletion

Add delete actions to complete the sidebar feature set.

- Define `DELETE /api/endpoints/{slug}/requests/{id}/` and `DELETE /api/endpoints/{slug}/requests/` MSW handlers
- Delete icon on each sidebar entry removes that request immediately (optimistic update)
- "Clear all" button in sidebar header opens a confirm dialog; on confirm, deletes all requests
- If the currently pinned request is deleted, fall back to the next most recent or the empty state
- Tests: delete single removes from list, clear all empties the list, confirm dialog blocks accidental deletion, deleting the selected request falls back correctly

_Watch out for: optimistic updates need a rollback strategy if the API call fails. For a local dev tool this is low stakes, but the pattern is worth doing correctly._

#### Step 1.7 — Detail panel polish

Finish the detail panel to the full spec before moving to the backend.

- Headers section collapsed by default behind a "Show headers" toggle
- Query params section collapsed behind a "Show query params" toggle, hidden entirely if empty
- First request shows detail view; subsequent requests show detail view by default with a toggle to switch (diff toggle is a no-op placeholder at this stage, activates in Phase 3)
- Empty state in the right panel when no requests have been received yet
- Tests: headers collapsed by default, toggle expands them, query params hidden when absent, empty state renders before first request

_Watch out for: the diff toggle placeholder should be visually present but clearly inactive so the layout does not need to change in Phase 3._

---

### Phase 2: Backend, connect frontend

#### Step 2.1 — Django project scaffold

Get a running Django project with all infrastructure connected but no application logic yet.

- Initialise Django project with uv + pyproject.toml; configure Ruff and pytest in pyproject.toml
- Install Django, DRF, Django Channels, daphne, psycopg2, and redis dependencies
- Configure Django to use PostgreSQL and Redis (via environment variables)
- Add Docker Compose services: django, postgres, redis; configure devcontainer to start all three
- Django starts and serves a 404 for all routes at this point; that is fine
- Configure Django to serve the React app's `index.html` for all unrecognised paths (mirrors Vite's fallback)
- Tests: Django starts, database connection succeeds, Redis connection succeeds

_Watch out for: Django Channels requires switching from WSGI to ASGI. Update `manage.py` and the Django settings `ASGI_APPLICATION` early; it is painful to retrofit later._

#### Step 2.2 — Data models and migrations

Define the data model and confirm it matches the API contract from Phase 1.

- Create the `Endpoint` and `WebhookRequest` models per the data model spec
- Add compound index on `(endpoint, received_at)`
- Run and commit the initial migration
- Tests: models save and retrieve correctly, compound index present in migration

#### Step 2.3 — Endpoint creation API

Implement the first REST endpoint and replace the MSW handler for endpoint creation.

- `POST /api/endpoints/` creates an endpoint and returns slug and URL
- Remove the MSW handler for this route and confirm the frontend works against the real API
- Tests: endpoint created with unique slug, response shape matches contract, duplicate slug collision handled

_Watch out for: slug generation needs to be collision-safe. Use `secrets.token_urlsafe` with a retry loop rather than UUID (UUIDs are long and ugly in URLs)._

#### Step 2.4 — Request listing API

Implement request listing and replace the MSW handler.

- `GET /api/endpoints/{slug}/requests/` returns requests in reverse chronological order
- `GET /api/endpoints/{slug}/requests/{id}/` returns a single request
- Remove MSW handlers for these routes and confirm the frontend works
- Tests: returns correct requests for slug, 404 on unknown slug, response shapes match contract

#### Step 2.5 — Webhook receiver

Implement the actual webhook ingestion endpoint.

- `ANY /hooks/{slug}/` accepts any HTTP method
- Validates JSON body; returns `400` for non-JSON or unparseable body, `200 {"success": true}` for valid
- Strips proxy headers per the filter list before storing
- Tests: all HTTP methods accepted, valid JSON stored, invalid JSON rejected, proxy headers stripped, custom headers preserved

#### Step 2.6 — Request deletion API

Implement deletion endpoints and remove the remaining MSW handlers.

- `DELETE /api/endpoints/{slug}/requests/{id}/` deletes a single request
- `DELETE /api/endpoints/{slug}/requests/` deletes all requests for an endpoint
- Remove MSW handlers for these routes
- Tests: single delete removes correct request, delete all empties the endpoint, 404 on unknown request

#### Step 2.7 — WebSocket consumer

Implement real-time delivery and replace the mock WebSocket.

- Django Channels consumer connects clients to a per-endpoint channel group
- When a request is ingested at `/hooks/{slug}/`, publish a `request.received` message to the channel group
- Message shape matches the WebSocket contract from Phase 1
- Replace the mock WebSocket in the frontend `useWebSocket` hook with the real connection
- Exponential backoff reconnect (1s base, 30s cap, jitter) implemented in the hook at this point
- Remove the development mock timer
- Tests: consumer joins correct group on connect, message published on request ingestion, consumer leaves group on disconnect (all with mocked channel layer)

_Watch out for: the channel layer needs to be configured in Django settings to use Redis. Without this, messages publish locally in-process only and will not reach other workers._

---

### Phase 3: Diff feature

#### Step 3.1 — Diff algorithm

Implement and exhaustively test the diff function before building any UI around it.

- Implement `diff(a: Record<string, unknown>, b: Record<string, unknown>): DiffEntry[]` as a pure TypeScript function
- Each `DiffEntry` has `path` (dot-notation), `type` (`changed` | `added` | `removed`), `oldValue`, `newValue`
- Arrays treated as atomic values (not recursed into)
- Tests: changed scalar, added field, removed field, deeply nested path, array atomicity, both inputs empty, one input empty

_This step produces no visible UI change. That is intentional: the algorithm should be correct and fully tested before any rendering depends on it._

#### Step 3.2 — Diff view

Wire the diff function into the UI and activate the toggle placeholder from Step 1.7.

- For any request after the first, compute the diff against the immediately preceding request on render
- Activate the detail/diff toggle; diff view is now the default for all requests after the first
- Two-column layout: previous request body on the left, current on the right
- Changed values highlighted, added and removed fields clearly marked with dot-notation paths
- Empty state shown when there is only one request
- Tests: diff view renders correct changed/added/removed entries, empty state on single request, toggle switches between detail and diff, first request always shows detail

---

### Phase 4+: Further features

Each subsequent feature follows the same pattern: MSW mock first, then backend, then connect. Candidate features are listed in Future Considerations.

---

## Core Features (v1 scope)

### 1. Endpoint Initialization

- On load, the app checks localStorage for a previously created endpoint slug
- If a slug exists, it is used and the app loads that endpoint's request history
- If no slug exists, a new endpoint is created automatically with a loading state shown while creation is in progress
- The slug is reflected in the URL as a clean path (e.g. `http://localhost:5173/a3f9bc2d`)
- Both the Vite dev server and Django are configured to serve the React app for any unrecognized path, enabling clean path routing without hash URLs
- The slug is persisted to localStorage so refreshing the page returns to the same endpoint
- A "New Endpoint" button allows the user to discard the current slug and create a fresh one; the old slug is permanently lost with no recovery path in v1 (see Future Considerations for endpoint history)

### 2. Request Capture

Each captured request stores:

- HTTP method
- Headers (see Header Filtering below)
- Parsed JSON body
- Query parameters
- Timestamp
- Endpoint foreign key

Requests with a non-JSON `Content-Type` or an unparseable body return `400 Bad Request` and are not stored. Valid JSON requests return `200 OK` with `{"success": true}`.

### 3. Header Filtering

Proxy-injected and infrastructure headers are stripped before storage so that only headers explicitly set by the sender are shown. The following headers are excluded:

- `X-Forwarded-For`
- `X-Forwarded-Host`
- `X-Forwarded-Proto`
- `X-Real-IP`
- Any header prefixed with `X-Amzn-` (AWS)
- Any header prefixed with `CF-` (Cloudflare)

The filter list is hardcoded in v1. It becomes configurable if the tool is ever deployed behind infrastructure.

### 4. Real-time Updates

- The frontend connects to the endpoint's WebSocket channel on load
- When a new request is captured, it is published to the Redis channel for that endpoint
- Django Channels delivers it to all connected WebSocket clients in real time
- No polling; the UI updates instantly on arrival
- WebSocket auto-reconnects silently on disconnection using exponential backoff, starting at 1 second and capping at 30 seconds with jitter; no user-visible indication in production
- In development (`NODE_ENV=development`) only, a small connection status indicator is shown to aid debugging during backend restarts

### 5. Request Sidebar

- Captured requests listed in reverse chronological order
- Sidebar header shows request count (e.g. "12 requests") and a subtle timestamp of when the last request arrived
- Each sidebar entry shows: method badge, absolute timestamp (`14:32:05`), and a single-line truncated body preview with `...` for long values
- Full date shown on hover for requests from a previous session
- Selecting a request pins it in the right panel
- When pinned on a previous request, new arrivals show a "N new request(s)" badge at the top of the sidebar without auto-switching the panel
- A "Jump to latest" button appears when the user is not viewing the most recent request
- Individual requests can be deleted from the sidebar with no confirm dialog
- A "Clear all" button in the sidebar header triggers a confirm dialog before deleting all requests for the endpoint

### 6. Request Detail Panel

- Shown for the first captured request and whenever a request is manually selected from the sidebar
- Displays: method badge, absolute timestamp, and pretty-printed syntax-highlighted JSON body via Shiki
- Headers shown collapsed by default behind a "Show headers" toggle
- Query params shown collapsed behind a "Show query params" toggle if present
- Empty state shown before any requests have been received: brief instruction text (e.g. "Send a request to your endpoint to get started") with the endpoint URL and copy button repeated for convenience

### 7. Endpoint URL Display

- Endpoint URL shown prominently in the page header at all times
- Copy button triggers a Sonner toast notification ("Copied!") on click
- No curl snippets or language examples in v1

### 8. Light/Dark Mode

- Follows system preference by default via Tailwind's `dark:` variant
- User can override via a toggle in the UI, preference stored in localStorage
- Shiki theme switches automatically to match light/dark mode
- No third-party theming library

### 9. Diff View (Phase 3)

- Shown automatically for every request after the first
- Diff is computed on the frontend as a pure TypeScript function operating on the two request bodies already in state; no round trip to the backend required
- Because the diff is always computed on demand from current state, deletions never produce stale results
- Auto-diffs the selected request against the one immediately preceding it
- Two-column layout: previous request on the left, current on the right
- Changed values highlighted, added and removed fields clearly marked
- Each change shows the dot-notation path (e.g. `data.object.amount`)
- A toggle allows switching back to the detail view for any request
- Empty state with explanation shown when there is only one request captured so far

---

## Data Model

### Endpoint

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| slug | CharField | Unique, random, URL-safe |
| created_at | DateTimeField | Auto |

### WebhookRequest

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| endpoint | ForeignKey | → Endpoint |
| method | CharField | GET, POST, etc. |
| headers | JSONField | Filtered headers |
| body | JSONField | Parsed JSON body |
| query_params | JSONField | |
| received_at | DateTimeField | Auto |

### Indexes

- Compound index on `(endpoint, received_at)` to support efficient reverse-chronological listing; added in the initial migration even for local use to document intent and avoid a painful migration later if the tool goes public

---

## API Contract

API shapes are defined during Phase 1 and treated as the contract the backend must fulfill in Phase 2.

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/endpoints/` | Create a new endpoint, returns slug and URL |
| GET | `/api/endpoints/{slug}/requests/` | List all captured requests for an endpoint |
| GET | `/api/endpoints/{slug}/requests/{id}/` | Get a single request |
| DELETE | `/api/endpoints/{slug}/requests/` | Delete all requests for an endpoint (no confirmation on the API; confirm dialog is frontend-only) |
| DELETE | `/api/endpoints/{slug}/requests/{id}/` | Delete a single request |
| ANY | `/hooks/{slug}/` | The actual webhook receiver URL |

Note: `DELETE /api/endpoints/{slug}/requests/` is not idempotent in a meaningful way; a second call silently succeeds with nothing left to delete. This is acceptable for v1.

### WebSocket

| Path | Description |
|---|---|
| `ws://localhost:8000/ws/endpoints/{slug}/` | Real-time channel for a given endpoint |

**WebSocket message shape (server to client):**

```json
{
  "type": "request.received",
  "request": {
    "id": "uuid",
    "method": "POST",
    "headers": {},
    "body": {},
    "query_params": {},
    "received_at": "2026-01-01T00:00:00Z"
  }
}
```

The WebSocket message never includes a precomputed diff. Diff is always computed on the frontend from state.

---

## Diff Logic

The diff is a pure TypeScript function with no side effects:

```ts
diff(a: Record<string, unknown>, b: Record<string, unknown>): DiffEntry[]
```

Each `DiffEntry` contains:

- `path`: dot-notation field path (e.g. `data.amount`)
- `type`: `"changed"`, `"added"`, or `"removed"`
- `oldValue`: value in A (undefined if added)
- `newValue`: value in B (undefined if removed)

Arrays are treated as atomic values in v1 (not recursed into). The function is fully unit tested in isolation with 100% branch coverage, covering changed values, added fields, removed fields, deeply nested paths, and array atomicity.

---

## Design

### Visual Style

- Minimal, monochrome, developer-tool aesthetic (reference: Postico, TablePlus)
- Color used only to convey meaning, never decoratively
- Clean typography, generous whitespace, strong information hierarchy

### Color Scheme

- Follows system preference (light/dark) by default via Tailwind's `dark:` variant
- User can override via a toggle in the UI, preference stored in localStorage
- Shiki syntax highlighting theme switches automatically to match

### Method Badges

Subtle color coding for HTTP method badges:

| Method | Color |
|---|---|
| GET | Blue |
| POST | Green |
| PUT | Yellow |
| PATCH | Orange |
| DELETE | Red |

### Timestamps

- Displayed as absolute time (`14:32:05`) throughout the UI
- Full date shown on hover (`2026-01-01 14:32:05`) for requests from a previous session
- No relative timestamps; this is a developer tool where exact timing matters

---

## Testing

### Backend

- 100% unit test coverage enforced via `pytest-cov` with a `--cov-fail-under=100` gate
- Tests cover:
  - Webhook receiver (valid JSON, invalid JSON, missing Content-Type, all HTTP methods)
  - Header filtering (proxy headers stripped, custom headers preserved)
  - REST API responses (correct shapes, 404 on missing slug)
  - Delete single request and delete all requests
  - WebSocket consumer (message published on request capture, mocked channel layer)

### Frontend

- 100% unit test coverage enforced via Vitest with a coverage threshold
- @testing-library/react used for all component tests; tests are behavior-focused not implementation-focused
- MSW handlers used in tests to mock API responses at the network level
- Tests cover:
  - Diff function (pure function: changed, added, removed, deeply nested paths, array atomicity, empty inputs)
  - Diff view rendering (changed, added, removed entries, null diff empty state)
  - Request sidebar behavior (selection, pinning, new request badge, jump to latest)
  - Delete single and clear all (confirm dialog behavior)
  - Loading state on initial endpoint creation
  - localStorage slug persistence and retrieval
  - URL routing (slug reflected in path, navigating to a slug loads that endpoint)
  - WebSocket hook (mock WebSocket, exponential backoff reconnect, incoming messages update state)
  - React Query hooks against MSW handlers
  - Sonner toast notification on URL copy
  - Light/dark toggle and localStorage persistence of preference
  - Connection status indicator visible only in development mode

---

## Deferred Improvements

Short-term improvements that should happen soon but aren't blocking current work. Distinct from Future Considerations below, which are long-term product ideas.

- ~~**Promote compose back to the root.** See "Current state" under Development Environment. Triggers when Step 2 lands.~~ Done in Step 2.1.

---

## Future Considerations

- Endpoint history: store previously created slugs in localStorage and allow switching between them rather than permanently discarding the old one on "New Endpoint"
- Manual diff selection between any two requests
- Field pinning: track a specific dot-notation path across all requests over time
- Request replay: resend a captured request to a configurable target URL
- HMAC signature verification for common providers (Stripe, GitHub)
- Support for non-JSON bodies (form data, plain text)
- Endpoint TTL and request limits
- User accounts with persistent endpoints
- Public deployment on AWS
- curl and language snippets in the empty state or alongside the endpoint URL
- Configurable header filter list for deployments behind custom infrastructure
