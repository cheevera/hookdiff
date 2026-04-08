import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getWebSocketUrl } from '@/lib/env'
import type { WebhookRequest } from '@/types/request'

type WebSocketStatus = 'connecting' | 'open' | 'closed'

type IncomingMessage = {
  type: string
  request: WebhookRequest
}

const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

function getReconnectDelay(attempt: number): number {
  const exponential = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
  return Math.random() * exponential
}

export function useWebSocket(slug: string | undefined) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<WebSocketStatus>('connecting')
  const attemptRef = useRef(0)

  useEffect(() => {
    if (!slug) return
    const currentSlug = slug

    let intentionalClose = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let socket: WebSocket

    function connect() {
      socket = new WebSocket(getWebSocketUrl(currentSlug))

      const handleOpen = () => {
        attemptRef.current = 0
        setStatus('open')
      }

      const handleClose = () => {
        setStatus('closed')
        if (!intentionalClose) {
          const delay = getReconnectDelay(attemptRef.current)
          attemptRef.current += 1
          reconnectTimer = setTimeout(connect, delay)
        }
      }

      const handleMessage = (ev: Event) => {
        let payload: IncomingMessage
        try {
          payload = JSON.parse((ev as MessageEvent).data) as IncomingMessage
        } catch {
          return
        }
        if (payload.type !== 'request.received') return
        queryClient.setQueryData<WebhookRequest[]>(['requests', currentSlug], (old) => [
          payload.request,
          ...(old ?? []),
        ])
      }

      socket.addEventListener('open', handleOpen)
      socket.addEventListener('close', handleClose)
      socket.addEventListener('message', handleMessage)
    }

    connect()

    return () => {
      intentionalClose = true
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer)
      }
      socket.close()
    }
  }, [slug, queryClient])

  return { status }
}
