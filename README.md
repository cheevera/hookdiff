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

## Status

Under active development. See `hookdiff-requirements.md` for the full spec and the Progress checklist at the top of that file for current implementation status.

## Future Considerations

Endpoint history with switching between previous slugs, manual diff between any two requests, field pinning across requests over time, request replay, HMAC signature verification for common providers, non-JSON body support, user accounts, public deployment.
