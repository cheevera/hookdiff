// Non-dev branch coverage depends on the global TestWebSocket stub installed
// by `src/test/setup.ts`. jsdom 26 has no native WebSocket, so without that
// stub `new WebSocket(url)` would throw before reaching any assertion.
import { afterEach, expect, test, vi } from 'vitest'
import { getTestWebSockets } from '../test/webSocketMock'
import * as env from './env'
import { MockWebSocket } from './mockWebSocket'
import { createWebSocket } from './webSocketFactory'

afterEach(() => {
  vi.restoreAllMocks()
})

test('returns a MockWebSocket in dev mode', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(true)
  const socket = createWebSocket('ws://example/dev')
  expect(socket).toBeInstanceOf(MockWebSocket)
  ;(socket as MockWebSocket).close()
})

test('returns a real WebSocket (the jsdom stub) outside of dev mode', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const socket = createWebSocket('ws://example/prod')
  expect(socket).not.toBeInstanceOf(MockWebSocket)
  const instances = getTestWebSockets()
  expect(instances).toHaveLength(1)
  expect(instances[0]).toBe(socket)
})
