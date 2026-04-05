import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { WebhookRequest } from '../types/request'
import { MockWebSocket } from './mockWebSocket'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('dispatches an open event after construction', async () => {
  const socket = new MockWebSocket('ws://example/test')
  const onOpen = vi.fn()
  socket.addEventListener('open', onOpen)
  await vi.advanceTimersByTimeAsync(0)
  expect(onOpen).toHaveBeenCalledTimes(1)
  socket.close()
})

test('emits a fake message every intervalMs and stops after close', async () => {
  const socket = new MockWebSocket('ws://example/test', 5000)
  const onMessage = vi.fn()
  socket.addEventListener('message', onMessage)

  await vi.advanceTimersByTimeAsync(5000)
  expect(onMessage).toHaveBeenCalledTimes(1)

  await vi.advanceTimersByTimeAsync(5000)
  expect(onMessage).toHaveBeenCalledTimes(2)

  socket.close()
  await vi.advanceTimersByTimeAsync(5000)
  expect(onMessage).toHaveBeenCalledTimes(2)
})

test('emitted payload parses as { type: "request.received", request }', async () => {
  const socket = new MockWebSocket('ws://example/payload', 1000)
  const received: string[] = []
  socket.addEventListener('message', (ev) => {
    received.push((ev as MessageEvent).data)
  })

  await vi.advanceTimersByTimeAsync(1000)

  expect(received).toHaveLength(1)
  const raw = received[0]
  if (!raw) throw new Error('expected at least one message')
  const payload = JSON.parse(raw) as { type: string; request: WebhookRequest }
  expect(payload.type).toBe('request.received')
  expect(payload.request.method).toBe('POST')
  expect(typeof payload.request.id).toBe('string')
  expect(payload.request.id).toContain('mock-')
  expect(payload.request.body).toEqual({ kind: 'mock', index: 1 })
  expect(typeof payload.request.receivedAt).toBe('string')
  expect(payload.request.headers).toEqual({ 'content-type': 'application/json' })
  expect(payload.request.queryParams).toEqual({})
  socket.close()
})

test('close is idempotent and dispatches exactly one close event', () => {
  const socket = new MockWebSocket('ws://example/idem')
  const onClose = vi.fn()
  socket.addEventListener('close', onClose)

  socket.close()
  socket.close()
  socket.close()

  expect(onClose).toHaveBeenCalledTimes(1)
})

test('constructor interval can be overridden', async () => {
  const socket = new MockWebSocket('ws://example/fast', 1000)
  const onMessage = vi.fn()
  socket.addEventListener('message', onMessage)

  await vi.advanceTimersByTimeAsync(1000)
  expect(onMessage).toHaveBeenCalledTimes(1)

  socket.close()
})
