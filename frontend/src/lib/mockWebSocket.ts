import type { WebhookRequest } from '../types/request'

export type WebSocketLike = Pick<WebSocket, 'addEventListener' | 'removeEventListener' | 'close'>

export class MockWebSocket extends EventTarget implements WebSocketLike {
  public readonly url: string
  private intervalId: ReturnType<typeof setInterval> | null = null
  private counter = 0

  constructor(url: string, intervalMs = 5000) {
    super()
    this.url = url
    queueMicrotask(() => {
      this.dispatchEvent(new Event('open'))
    })
    this.intervalId = setInterval(() => this.emitFake(), intervalMs)
  }

  close(): void {
    if (this.intervalId === null) return
    clearInterval(this.intervalId)
    this.intervalId = null
    this.dispatchEvent(new Event('close'))
  }

  private emitFake(): void {
    this.counter += 1
    const request: WebhookRequest = {
      id: `mock-${this.url}-${this.counter}`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { kind: 'mock', index: this.counter },
      queryParams: {},
      receivedAt: new Date().toISOString(),
    }
    const payload = { type: 'request.received', request }
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(payload) }))
  }
}
