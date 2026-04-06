# hookdiff

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
| Backend | Django + Django REST Framework, Daphne (ASGI), Django Channels, PostgreSQL 16, Redis 7 |
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
   make migrate
   make dev
   ```

4. Visit http://localhost:5173 in your host browser.

To start the Django backend (serves the API and the built SPA):

```
make dev-back
```

The devcontainer is the only supported entry point today. Running the project directly on the host is untested and not recommended.

## Make Targets

Run from the repo root inside the devcontainer:

### Frontend

| Target | What it does |
|---|---|
| `make dev` | Start the Vite dev server on port 5173 |
| `make test` | Run the frontend test suite once |
| `make coverage` | Run the frontend test suite with the 100% coverage gate |
| `make build` | Type-check and produce a production build |
| `make check-front` | Run Biome lint + format check (read-only) |
| `make format-front` | Auto-fix Biome lint + format issues |
| `make install` | Install frontend dependencies |

### Backend

| Target | What it does |
|---|---|
| `make dev-back` | Start Django dev server via Daphne on port 8000 |
| `make test-back` | Run the backend test suite once |
| `make coverage-back` | Run the backend test suite with the 100% coverage gate |
| `make check-back` | Run Ruff lint + format check (read-only) |
| `make format-back` | Auto-fix Ruff lint + format issues |
| `make migrate` | Run Django migrations |

### Combined

| Target | What it does |
|---|---|
| `make check` | Run both Biome + Ruff checks |
| `make format` | Run both Biome + Ruff fixes |

Running `make` with no target prints this list.

## Status

**Work in progress.** Phase 1 (frontend on mocked APIs) is complete through Step 1.7. Phase 2 (Django backend) is in progress: Step 2.1 (project scaffold with PostgreSQL and Redis) is done. Steps 2.2 through 2.7 (data models, REST APIs, webhook receiver, WebSocket consumer) and Phase 3 (JSON diff view) are still ahead. See `hookdiff-requirements.md` for the full spec and the Progress checklist at the top for exact implementation status.
