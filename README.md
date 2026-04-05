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
2. When prompted, click **Reopen in Container** (or run the command **Dev Containers: Reopen in Container**). The first build installs Node, pnpm, git, and make, then runs `pnpm install` via `postCreateCommand`.
3. Open a terminal inside the devcontainer (`` Ctrl+` ``) and run:

   ```
   make dev
   ```

4. Visit http://localhost:5173 in your host browser.

The devcontainer is the only supported entry point today. Running the frontend directly on the host is untested and not recommended.

## Make Targets

Run from the repo root inside the devcontainer:

| Target | What it does |
|---|---|
| `make dev` | Start the Vite dev server on port 5173 |
| `make test` | Run the frontend test suite once |
| `make build` | Type-check and produce a production build |
| `make check` | Run Biome lint + format check (read-only) |
| `make format` | Auto-fix Biome lint + format issues |
| `make install` | Install frontend dependencies |

Running `make` with no target prints this list.

## Status

Under active development. See `hookdiff-requirements.md` for the full spec and the Progress checklist at the top of that file for current implementation status.

## Divergence from the spec

`hookdiff-requirements.md` describes the end-state architecture: a root `docker-compose.yml` orchestrating the frontend, a Django backend, Postgres, and Redis, shared between the devcontainer and a host workflow. That's still the target.

Today we're only on Step 1.2 (static frontend shell). Until the backend lands in Step 2, there is only one service, so:

- There is no root `docker-compose.yml`. The only compose file is `.devcontainer/docker-compose.yml`.
- The devcontainer uses its own minimal Dockerfile (`.devcontainer/Dockerfile`) instead of reusing `frontend/Dockerfile`, because the dev environment needs extra tools (git, make) that don't belong in the production frontend image.
- The only supported way to run the project is "open in devcontainer, then `make dev`".

When Step 2 adds the backend, we'll likely promote compose back to the root and point the devcontainer at it, matching the spec.

## Deferred Improvements

Worth doing soon, but not yet. Parked here so they don't get lost:

- **Pin `packageManager` in `frontend/package.json`.** Add `"packageManager": "pnpm@10.33.0"` so every tool (corepack, CI, editor integrations) uses the same pnpm version. One source of truth instead of a version string hardcoded in `.devcontainer/Dockerfile`.
- **CI workflow.** GitHub Actions running `make check && make test && make build` on pushes and pull requests. Low value solo, high value the moment a second contributor or a regression lands.
- **Pre-commit hooks.** Run `make check` before commits. Currently skipped because the habit works, but reconsider after the first "forgot to format" commit.
- **Promote compose back to the root.** See "Divergence from the spec" above. Triggers when Step 2 lands.

## Future Considerations

Endpoint history with switching between previous slugs, manual diff between any two requests, field pinning across requests over time, request replay, HMAC signature verification for common providers, non-JSON body support, user accounts, public deployment.
