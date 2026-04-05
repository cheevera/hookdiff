// A tiny WebSocket stand-in for jsdom tests. jsdom 26 does not ship a
// `globalThis.WebSocket`, and MSW 2.x patches the global as part of
// `server.listen()`. `src/test/setup.ts` installs this class AFTER
// `server.listen()` runs so that our tests control socket creation. Test code
// can grab the created sockets via `getTestWebSockets()` and drive them
// directly by dispatching MessageEvent / Event instances.

const instances: TestWebSocket[] = []

export class TestWebSocket extends EventTarget {
  public readonly url: string
  private closed = false

  constructor(url: string) {
    super()
    this.url = url
    instances.push(this)
    // Let the hook attach its listeners before the open event fires.
    queueMicrotask(() => {
      this.dispatchEvent(new Event('open'))
    })
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.dispatchEvent(new Event('close'))
  }
}

export function getTestWebSockets(): readonly TestWebSocket[] {
  return instances
}

export function resetTestWebSockets(): void {
  instances.length = 0
}
