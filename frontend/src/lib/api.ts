import { buildTestPayload } from '@/lib/testPayload'
import type { Endpoint } from '@/types/endpoint'
import type { WebhookRequest } from '@/types/request'

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

export async function sendTestRequest(slug: string): Promise<void> {
  const response = await fetch(`/hooks/${slug}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTestPayload()),
  })
  if (!response.ok) throw new Error(`Failed to send test request: ${response.status}`)
}
