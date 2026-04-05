import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { App } from '../App'
import { ENDPOINT_STORAGE_KEY } from '../lib/endpoint'
import * as env from '../lib/env'
import { MOCK_REQUESTS } from '../mocks/fixtures'
import { server } from '../mocks/server'
import { renderWithProviders } from '../test/utils'
import { getTestWebSockets, type TestWebSocket } from '../test/webSocketMock'
import type { WebhookRequest } from '../types/request'
import { EndpointView } from './EndpointView'

beforeEach(() => {
  localStorage.clear()
  // Force the non-dev branch so the WebSocket factory uses the global
  // TestWebSocket stub from setup.ts instead of MockWebSocket's timer loop.
  vi.spyOn(env, 'isDev').mockReturnValue(false)
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('clicking New Endpoint creates a new endpoint, updates localStorage, and navigates to the new slug', async () => {
  server.use(
    http.post('/api/endpoints/', () =>
      HttpResponse.json({
        slug: 'freshnew',
        url: 'http://localhost:8000/hooks/freshnew/',
        createdAt: '2026-04-05T00:00:00.000Z',
      }),
    ),
  )

  const user = userEvent.setup()
  renderWithProviders(<App />, { initialEntries: ['/oldslug1'] })

  // Starts on the old slug.
  expect(screen.getByText('http://localhost:8000/hooks/oldslug1/')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /new endpoint/i }))

  await waitFor(() => {
    expect(screen.getByText('http://localhost:8000/hooks/freshnew/')).toBeInTheDocument()
  })
  expect(screen.queryByText('http://localhost:8000/hooks/oldslug1/')).not.toBeInTheDocument()
  await waitFor(() => {
    expect(localStorage.getItem(ENDPOINT_STORAGE_KEY)).toBe('freshnew')
  })
})

test('clicking a sidebar item updates the detail panel', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<App />, { initialEntries: ['/a3f9bc2d'] })

  // Wait for the initial Shiki render (default: first request selected).
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const firstBodyMarker = 'payment_intent.succeeded'
  expect(container.querySelector('pre.shiki')?.textContent).toContain(firstBodyMarker)

  // Click the button for the second mock request (PUT, userId 918).
  const secondRequest = MOCK_REQUESTS[1]
  if (!secondRequest) throw new Error('expected at least two mock requests')
  const buttons = screen.getAllByRole('button')
  const target = buttons.find((b) => b.textContent?.includes('918'))
  if (!target) throw new Error('expected a sidebar button for the second request')
  await user.click(target)

  // Detail panel re-renders through Shiki with the new request body.
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('Ada Lovelace')
  })
  expect(container.querySelector('pre.shiki')?.textContent).not.toContain(firstBodyMarker)
})

test('shows a loading state while the request list is in flight', async () => {
  let resolveRequests: (() => void) | null = null
  server.use(
    http.get(
      '/api/endpoints/:slug/requests/',
      () =>
        new Promise<Response>((resolve) => {
          resolveRequests = () => resolve(HttpResponse.json(MOCK_REQUESTS))
        }),
    ),
  )

  renderWithProviders(<App />, { initialEntries: ['/pendingx'] })

  expect(await screen.findByText(/loading requests/i)).toBeInTheDocument()

  if (!resolveRequests) throw new Error('handler did not capture resolver')
  ;(resolveRequests as () => void)()

  await waitFor(() => {
    expect(screen.queryByText(/loading requests/i)).not.toBeInTheDocument()
  })
})

test('shows an error state when the request list fails', async () => {
  server.use(
    http.get('/api/endpoints/:slug/requests/', () => new HttpResponse(null, { status: 500 })),
  )

  renderWithProviders(<App />, { initialEntries: ['/errslug1'] })

  expect(await screen.findByText(/failed to load requests/i)).toBeInTheDocument()
})

test('shows the empty state when there are no requests for this endpoint', async () => {
  server.use(http.get('/api/endpoints/:slug/requests/', () => HttpResponse.json([])))

  renderWithProviders(<App />, { initialEntries: ['/emptysl1'] })

  expect(await screen.findByText(/no requests yet/i)).toBeInTheDocument()
  expect(screen.getByText(/no request selected/i)).toBeInTheDocument()
})

function makeIncomingRequest(overrides: Partial<WebhookRequest> = {}): WebhookRequest {
  return {
    id: `incoming-${Math.random().toString(36).slice(2, 10)}`,
    method: 'POST',
    headers: {},
    body: { marker: 'incoming' },
    queryParams: {},
    receivedAt: '2026-04-05T15:00:00.000Z',
    ...overrides,
  }
}

async function pushWebhook(request: WebhookRequest): Promise<void> {
  const sockets = getTestWebSockets()
  const socket = sockets[sockets.length - 1] as TestWebSocket | undefined
  if (!socket) throw new Error('expected an open TestWebSocket')
  await act(async () => {
    socket.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ type: 'request.received', request }),
      }),
    )
  })
}

test('incoming websocket message prepends the request to the sidebar', async () => {
  renderWithProviders(<App />, { initialEntries: ['/testslg1'] })
  await screen.findByText('3 requests')

  const incoming = makeIncomingRequest({ id: 'ws_incoming_01', body: { marker: 'ws-alpha' } })
  await pushWebhook(incoming)

  await waitFor(() => {
    expect(screen.getByText('4 requests')).toBeInTheDocument()
  })
  expect(screen.getByText('{"marker":"ws-alpha"}')).toBeInTheDocument()
})

test('pinning prevents new arrivals from switching the detail panel', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<App />, { initialEntries: ['/testslg2'] })

  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  // Pin req_02 (the "918 / Ada Lovelace" request).
  const buttons = screen.getAllByRole('button')
  const putButton = buttons.find((b) => b.textContent?.includes('918'))
  if (!putButton) throw new Error('expected a sidebar button for the PUT request')
  await user.click(putButton)
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('Ada Lovelace')
  })

  const incoming = makeIncomingRequest({ id: 'ws_incoming_pin', body: { marker: 'do-not-switch' } })
  await pushWebhook(incoming)

  await waitFor(() => {
    expect(screen.getByText('4 requests')).toBeInTheDocument()
  })
  expect(container.querySelector('pre.shiki')?.textContent).toContain('Ada Lovelace')
  expect(container.querySelector('pre.shiki')?.textContent).not.toContain('do-not-switch')
})

test('shows N new requests badge and jump-to-latest button while pinned', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<App />, { initialEntries: ['/testslg3'] })

  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const buttons = screen.getAllByRole('button')
  const putButton = buttons.find((b) => b.textContent?.includes('918'))
  if (!putButton) throw new Error('expected a sidebar button for the PUT request')
  await user.click(putButton)

  await pushWebhook(makeIncomingRequest({ id: 'ws_badge_01', body: { marker: 'badge-one' } }))
  await pushWebhook(makeIncomingRequest({ id: 'ws_badge_02', body: { marker: 'badge-two' } }))

  await waitFor(() => {
    expect(screen.getByText('2 new requests')).toBeInTheDocument()
  })
  expect(screen.getByRole('button', { name: /jump to latest/i })).toBeInTheDocument()
})

test('jump to latest clears the pin, displays the latest, and re-engages auto-follow', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<App />, { initialEntries: ['/testslg4'] })

  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const buttons = screen.getAllByRole('button')
  const putButton = buttons.find((b) => b.textContent?.includes('918'))
  if (!putButton) throw new Error('expected a sidebar button for the PUT request')
  await user.click(putButton)
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('Ada Lovelace')
  })

  await pushWebhook(makeIncomingRequest({ id: 'ws_jump_01', body: { marker: 'first-new' } }))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /jump to latest/i })).toBeInTheDocument()
  })

  await user.click(screen.getByRole('button', { name: /jump to latest/i }))
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('first-new')
  })

  await pushWebhook(makeIncomingRequest({ id: 'ws_jump_02', body: { marker: 'second-new' } }))
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('second-new')
  })
  expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument()
})

test('drops a stale pin when the pinned request leaves the list', async () => {
  const user = userEvent.setup()
  const { container, queryClient } = renderWithProviders(<App />, {
    initialEntries: ['/testslg5'],
  })

  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const buttons = screen.getAllByRole('button')
  const putButton = buttons.find((b) => b.textContent?.includes('918'))
  if (!putButton) throw new Error('expected a sidebar button for the PUT request')
  await user.click(putButton)
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('Ada Lovelace')
  })

  // Swap the cache to a list that no longer includes req_02. The stale-pin
  // effect should clear the pin and the panel should fall back to list[0].
  const remaining = MOCK_REQUESTS.filter((r) => r.id !== 'req_02')
  await act(async () => {
    queryClient.setQueryData(['requests', 'testslg5'], remaining)
  })

  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).not.toContain('Ada Lovelace')
  })
  expect(container.querySelector('pre.shiki')?.textContent).toContain('payment_intent.succeeded')
})

test('EndpointView renders nothing when the route has no slug param', () => {
  // Mount EndpointView on a route that does not define `:slug` so useParams()
  // returns undefined and the guard branch is exercised.
  renderWithProviders(
    <Routes>
      <Route path="/" element={<EndpointView />} />
    </Routes>,
    { initialEntries: ['/'] },
  )
  // The view is a guard-return, so none of its children should render.
  expect(screen.queryByText('Hookdiff')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /new endpoint/i })).not.toBeInTheDocument()
})
