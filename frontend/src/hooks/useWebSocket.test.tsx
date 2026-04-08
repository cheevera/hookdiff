import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { useWebSocket } from '@/hooks/useWebSocket'
import * as env from '@/lib/env'
import { getTestWebSockets, TestWebSocket } from '@/test/webSocketMock'
import type { WebhookRequest } from '@/types/request'

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

test('ignores messages that are not valid JSON', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'slug1'], [existingRequest])

  renderHook(() => useWebSocket('slug1'), { wrapper: makeWrapper(queryClient) })

  const socket = getTestWebSockets()[0]
  if (!socket) throw new Error('expected a socket')
  await act(async () => {
    socket.dispatchEvent(new MessageEvent('message', { data: 'not-valid-json{{{' }))
  })

  expect(queryClient.getQueryData<WebhookRequest[]>(['requests', 'slug1'])).toEqual([
    existingRequest,
  ])
})

test('transitions to closed when a close event fires', async () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  vi.useFakeTimers()
  const queryClient = makeQueryClient()
  const { result } = renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
  expect(result.current.status).toBe('open')

  const socket = getTestWebSockets()[0]
  if (!socket) throw new Error('expected a socket')
  await act(async () => {
    socket.dispatchEvent(new Event('close'))
  })

  expect(result.current.status).toBe('closed')
  vi.useRealTimers()
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

test('reconnects after an unexpected close', async () => {
  vi.useFakeTimers()
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()

  const { result } = renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
  expect(result.current.status).toBe('open')

  const socket1 = getTestWebSockets()[0]
  if (!socket1) throw new Error('expected a socket')
  await act(async () => {
    socket1.dispatchEvent(new Event('close'))
  })
  expect(result.current.status).toBe('closed')

  // Advance past max possible first reconnect delay and let open fire
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(0)
  })

  expect(getTestWebSockets().length).toBe(2)
  expect(result.current.status).toBe('open')

  vi.useRealTimers()
})

test('backoff delay increases with consecutive failures', async () => {
  vi.useFakeTimers()
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  vi.spyOn(Math, 'random').mockReturnValue(1)
  const queryClient = makeQueryClient()

  renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })

  // Close first socket: attempt 0, delay = 1 * 1000 * 2^0 = 1000ms
  const socket1 = getTestWebSockets()[0]
  if (!socket1) throw new Error('expected a socket')
  await act(async () => {
    socket1.dispatchEvent(new Event('close'))
  })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(999)
  })
  expect(getTestWebSockets().length).toBe(1)

  // Fire reconnect timer synchronously so the new socket's open microtask
  // hasn't run yet, keeping the attempt counter at 1.
  act(() => {
    vi.advanceTimersByTime(1)
  })
  expect(getTestWebSockets().length).toBe(2)

  // Close socket2 before its open event fires. The attempt counter is still 1
  // (not reset by open), so the next delay = 1 * 1000 * 2^1 = 2000ms.
  const socket2 = getTestWebSockets()[1]
  if (!socket2) throw new Error('expected a second socket')
  act(() => {
    socket2.dispatchEvent(new Event('close'))
  })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1999)
  })
  expect(getTestWebSockets().length).toBe(2)

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1)
  })
  expect(getTestWebSockets().length).toBe(3)

  vi.useRealTimers()
})

test('does not reconnect on intentional unmount', async () => {
  vi.useFakeTimers()
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const queryClient = makeQueryClient()

  const { unmount } = renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })

  await vi.advanceTimersByTimeAsync(0)
  unmount()

  await vi.advanceTimersByTimeAsync(60_000)
  expect(getTestWebSockets().length).toBe(1)

  vi.useRealTimers()
})

test('resets backoff delay after a successful reconnect', async () => {
  vi.useFakeTimers()
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  vi.spyOn(Math, 'random').mockReturnValue(1)
  const queryClient = makeQueryClient()

  renderHook(() => useWebSocket('slug1'), {
    wrapper: makeWrapper(queryClient),
  })

  await vi.advanceTimersByTimeAsync(0)

  // First disconnect: attempt 0, delay = 1000ms
  const socket1 = getTestWebSockets()[0]
  if (!socket1) throw new Error('expected a socket')
  await act(async () => {
    socket1.dispatchEvent(new Event('close'))
  })

  await vi.advanceTimersByTimeAsync(1000)
  expect(getTestWebSockets().length).toBe(2)
  await vi.advanceTimersByTimeAsync(0) // open fires, resets attempt to 0

  // Second disconnect after successful reconnect: attempt should be 0 again, delay = 1000ms
  const socket2 = getTestWebSockets()[1]
  if (!socket2) throw new Error('expected a second socket')
  await act(async () => {
    socket2.dispatchEvent(new Event('close'))
  })

  // If attempt was NOT reset, delay would be 2000ms. At 1000ms we should see reconnect.
  await vi.advanceTimersByTimeAsync(1000)
  expect(getTestWebSockets().length).toBe(3)

  vi.useRealTimers()
})
