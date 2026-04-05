import type { WebhookRequest } from '../types/request'

export async function fetchRequests(slug: string): Promise<WebhookRequest[]> {
  const response = await fetch(`/api/endpoints/${slug}/requests/`)
  if (!response.ok) {
    throw new Error(`Failed to fetch requests: ${response.status}`)
  }
  return (await response.json()) as WebhookRequest[]
}
