// jsdom does not provide a global WebSocket, and MSW 2.x patches the global
// as part of `server.listen()`. We install our own controllable test stub
// AFTER MSW's listen runs so that tests own `new WebSocket(...)`. Tests can
// grab the created instances via `getTestWebSockets()` from `./webSocketMock`.
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'
import { resetTestWebSockets, TestWebSocket } from './webSocketMock'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  Object.defineProperty(globalThis, 'WebSocket', {
    value: TestWebSocket,
    writable: true,
    configurable: true,
  })
})
afterEach(() => {
  server.resetHandlers()
  resetTestWebSockets()
})
afterAll(() => server.close())
