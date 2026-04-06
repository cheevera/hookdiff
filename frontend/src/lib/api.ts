import type { Endpoint } from '../types/endpoint'
import type { WebhookRequest } from '../types/request'

export async function createEndpoint(): Promise<Endpoint> {
  const response = await fetch('/api/endpoints/', { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Failed to create endpoint: ${response.status}`)
  }
  return (await response.json()) as Endpoint
}

export async function fetchRequests(slug: string): Promise<WebhookRequest[]> {
  const response = await fetch(`/api/endpoints/${slug}/requests/`)
  if (!response.ok) {
    throw new Error(`Failed to fetch requests: ${response.status}`)
  }
  return (await response.json()) as WebhookRequest[]
}

export async function deleteRequest(slug: string, id: string): Promise<void> {
  const response = await fetch(`/api/endpoints/${slug}/requests/${id}/`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`Failed to delete request: ${response.status}`)
}

export async function deleteAllRequests(slug: string): Promise<void> {
  const response = await fetch(`/api/endpoints/${slug}/requests/`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`Failed to delete requests: ${response.status}`)
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

function buildTestPayload(): object {
  const statuses = ['succeeded', 'pending', 'failed'] as const
  const events = ['payment_intent.succeeded', 'payment_intent.created', 'charge.updated'] as const
  const amounts = [1999, 2499, 4900, 9900, 14999]

  return {
    id: `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
    type: randomItem([...events]),
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `pi_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
        amount: randomItem(amounts),
        currency: 'usd',
        status: randomItem([...statuses]),
        customer: 'cus_R8k2xL9mNvQ4',
        metadata: {
          order_id: `order_${Math.floor(Math.random() * 9000) + 1000}`,
        },
      },
    },
  }
}

export async function sendTestRequest(slug: string): Promise<void> {
  const response = await fetch(`/hooks/${slug}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTestPayload()),
  })
  if (!response.ok) throw new Error(`Failed to send test request: ${response.status}`)
}
