import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createWebSocket } from '../lib/webSocketFactory'
import type { WebhookRequest } from '../types/request'

type WebSocketStatus = 'connecting' | 'open' | 'closed'

type IncomingMessage = {
  type: string
  request: WebhookRequest
}

export function useWebSocket(slug: string | undefined) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<WebSocketStatus>('connecting')

  useEffect(() => {
    if (!slug) return
    const socket = createWebSocket(`ws://localhost:8000/ws/endpoints/${slug}/`)

    const handleOpen = () => setStatus('open')
    const handleClose = () => setStatus('closed')
    const handleMessage = (ev: Event) => {
      const payload = JSON.parse((ev as MessageEvent).data) as IncomingMessage
      if (payload.type !== 'request.received') return
      queryClient.setQueryData<WebhookRequest[]>(['requests', slug], (old) => [
        payload.request,
        ...(old ?? []),
      ])
    }

    socket.addEventListener('open', handleOpen)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('message', handleMessage)

    return () => {
      socket.removeEventListener('open', handleOpen)
      socket.removeEventListener('close', handleClose)
      socket.removeEventListener('message', handleMessage)
      socket.close()
    }
  }, [slug, queryClient])

  return { status }
}
