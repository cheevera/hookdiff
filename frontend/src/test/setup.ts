// jsdom does not provide a global WebSocket, so install a controllable test
// stub before any module touches `new WebSocket(...)`. Tests can grab the
// created instances via `getTestWebSockets()` from `./webSocketMock`.
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'
import { resetTestWebSockets, TestWebSocket } from './webSocketMock'

Object.defineProperty(globalThis, 'WebSocket', {
  value: TestWebSocket,
  writable: true,
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetTestWebSockets()
})
afterAll(() => server.close())
