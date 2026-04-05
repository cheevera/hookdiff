import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import * as env from '../lib/env'
import { getTestWebSockets, TestWebSocket } from '../test/webSocketMock'
import type { WebhookRequest } from '../types/request'
import { useWebSocket } from './useWebSocket'

afterEach(() => {
  vi.restoreAllMocks()
})

function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const sampleRequest: WebhookRequest = {
  id: 'req_new',
  method: 'POST',
  headers: {},
  body: { hello: 'world' },
  queryParams: {},
  receivedAt: '2026-04-05T15:00:00.000Z',
}

const existingRequest: WebhookRequest = {
  id: 'req_old',
  method: 'GET',
  headers: {},
  body: { first: true },
  queryParams: {},
  receivedAt: '2026-04-05T14:00:00.000Z',
}

async function dispatchMessage(socket: TestWebSocket, data: unknown): Promise<void> {
  await act(async () => {
    socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }))
  })
}

test('does not create a socket when slug is undefined', () => {
  // Force non-dev so the factory uses the global TestWebSocket stub.
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()
  const { result } = renderHook(() => useWebSocket(undefined), {
    wrapper: makeWrapper(queryClient),
  })
  expect(getTestWebSockets()).toHaveLength(0)
  expect(result.current.status).toBe('connecting')
})

test('transitions to open after the socket open event', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()
  const { result } = renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })
  await waitFor(() => {
    expect(result.current.status).toBe('open')
  })
})

test('prepends a request.received payload to the existing cache', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'slug1'], [existingRequest])

  renderHook(() => useWebSocket('slug1'), { wrapper: makeWrapper(queryClient) })

  const sockets = getTestWebSockets()
  const socket = sockets[0]
  if (!socket) throw new Error('expected a socket')
  await dispatchMessage(socket, { type: 'request.received', request: sampleRequest })

  expect(queryClient.getQueryData<WebhookRequest[]>(['requests', 'slug1'])).toEqual([
    sampleRequest,
    existingRequest,
  ])
})

test('initializes cache from undefined when there is no prior data', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()

  renderHook(() => useWebSocket('slug1'), { wrapper: makeWrapper(queryClient) })

  const socket = getTestWebSockets()[0]
  if (!socket) throw new Error('expected a socket')
  await dispatchMessage(socket, { type: 'request.received', request: sampleRequest })

  expect(queryClient.getQueryData<WebhookRequest[]>(['requests', 'slug1'])).toEqual([sampleRequest])
})

test('ignores messages whose type is not request.received', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'slug1'], [existingRequest])

  renderHook(() => useWebSocket('slug1'), { wrapper: makeWrapper(queryClient) })

  const socket = getTestWebSockets()[0]
  if (!socket) throw new Error('expected a socket')
  await dispatchMessage(socket, { type: 'other', request: sampleRequest })

  expect(queryClient.getQueryData<WebhookRequest[]>(['requests', 'slug1'])).toEqual([
    existingRequest,
  ])
})

test('transitions to closed when a close event fires', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()
  const { result } = renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })
  await waitFor(() => {
    expect(result.current.status).toBe('open')
  })

  const socket = getTestWebSockets()[0]
  if (!socket) throw new Error('expected a socket')
  await act(async () => {
    socket.dispatchEvent(new Event('close'))
  })

  expect(result.current.status).toBe('closed')
})

test('closes the socket on unmount', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const closeSpy = vi.spyOn(TestWebSocket.prototype, 'close')
  const queryClient = makeQueryClient()
  const { unmount } = renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })
  unmount()
  expect(closeSpy).toHaveBeenCalled()
})
