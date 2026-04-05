import * as env from './env'
import { MockWebSocket, type WebSocketLike } from './mockWebSocket'

export function createWebSocket(url: string): WebSocketLike {
  if (env.isDev()) {
    return new MockWebSocket(url)
  }
  return new WebSocket(url)
}
