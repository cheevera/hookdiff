# hookdiff

> **Work in progress.** Request capture, real-time streaming, and the full REST API are functional. JSON diff view (the core differentiator) is not yet implemented. See the Status section at the bottom for details.

A local developer tool for capturing, inspecting, and diffing incoming webhook requests. Inspired by webhook.site, with a core differentiator: structured JSON diff and field-level value tracking across multiple captured requests.

The initial version is scoped for personal local use. The architecture is designed to support public deployment and user accounts in the future.

## Why

Webhook debugging tools usually stop at "show me the request". When you're integrating with a provider whose payloads change over time (Stripe, GitHub, a partner API), the interesting question is rarely "what did this request look like?" and almost always "what changed between this request and the last one?". hookdiff makes that the primary view.

## Planned Features (v1)

- **Ephemeral local endpoints.** Spin up a random webhook URL on load, persisted in localStorage. One endpoint at a time, no auth.
- **Request capture.** Accepts any HTTP method at `/hooks/{slug}/`. Stores method, headers, parsed JSON body, query params, and timestamp. Non-JSON bodies are rejected with `400`.
- **Header filtering.** Proxy and infrastructure headers (`X-Forwarded-*`, `X-Real-IP`, `X-Amzn-*`, `CF-*`) are stripped before storage so only headers the sender set are shown.
- **Real-time request list.** Requests stream into the sidebar over a WebSocket with no polling. Pinning a request prevents auto-switching when new ones arrive.
- **Syntax-highlighted detail view.** Pretty-printed JSON body via Shiki, with collapsible headers and query params sections.
- **JSON diff view.** For every request after the first, a two-column diff view highlights changed, added, and removed fields with dot-notation paths (e.g. `data.object.amount`). Arrays are treated as atomic values in v1.
- **Request deletion.** Delete individual requests inline or clear all with a confirm dialog.
- **Light and dark mode.** Follows system preference, overridable via a toggle. Shiki theme switches to match.

## Stack

| Layer | Technology |
|---|---|
| Backend | Django + Django REST Framework, Uvicorn (ASGI), Django Channels, PostgreSQL 16, Redis 7 |
| Frontend | React 19 + TypeScript, Vite, Tailwind v4, React Router v7, TanStack React Query, Shiki, Sonner |
| Testing | pytest + pytest-cov (backend), Vitest + Testing Library + MSW (frontend) |
| Tooling | uv (Python), pnpm (Node), Ruff, Biome |
| Infra | Docker Compose, VS Code devcontainer |

## Getting Started

Prerequisites:

- Docker Desktop (or equivalent)
- VS Code with the **Dev Containers** extension (`ms-vscode-remote.remote-containers`)

Steps:

1. Clone the repo and open it in VS Code.
2. When prompted, click **Reopen in Container** (or run the command **Dev Containers: Reopen in Container**). The first build installs Node, pnpm, Python, uv, git, and make, then runs `pnpm install` and `uv sync` via `postCreateCommand`.
3. Open a terminal inside the devcontainer (`` Ctrl+` ``) and run:

   ```
   make dev
   ```

   Migrations run automatically on container start. `make dev` starts both the Vite frontend and Django backend concurrently.

4. Visit http://localhost:5173 in your host browser.

The devcontainer is the only supported entry point today. Running the project directly on the host is untested and not recommended.

## Make Targets

Run from the repo root inside the devcontainer:

### Frontend

| Target | What it does |
|---|---|
| `make dev-front` | Start the Vite dev server on port 5173 |
| `make test` | Run the frontend test suite once |
| `make coverage` | Run the frontend test suite with the 100% coverage gate |
| `make build` | Type-check and produce a production build |
| `make check-front` | Run Biome lint + format check (read-only) |
| `make format-front` | Auto-fix Biome lint + format issues |
| `make install` | Install frontend dependencies |

### Backend

| Target | What it does |
|---|---|
| `make dev-back` | Start Django dev server via Uvicorn on port 8000 (with `--reload`) |
| `make test-back` | Run the backend test suite once |
| `make coverage-back` | Run the backend test suite with the 100% coverage gate |
| `make check-back` | Run Ruff lint + format check (read-only) |
| `make format-back` | Auto-fix Ruff lint + format issues |
| `make migrate` | Run Django migrations |

### Combined

| Target | What it does |
|---|---|
| `make dev` | Start frontend + backend concurrently |
| `make check` | Run both Biome + Ruff checks |
| `make format` | Run both Biome + Ruff fixes |

Running `make` with no target prints this list.

## Status

**Work in progress.** Phase 1 (frontend on mocked APIs) and Phase 2 (Django backend) are complete. The backend serves REST APIs for endpoint creation, request listing, request deletion, and webhook ingestion, plus a WebSocket consumer for real-time updates. Phase 3 (JSON diff view) is still ahead. See `hookdiff-requirements.md` for the full spec and the Progress checklist at the top for exact implementation status.
