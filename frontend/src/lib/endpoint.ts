import type { Endpoint } from '../types/endpoint'

export const ENDPOINT_STORAGE_KEY = 'hookdiff-endpoint-slug'

export function readStoredSlug(): string | null {
  try {
    return localStorage.getItem(ENDPOINT_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredSlug(slug: string): void {
  try {
    localStorage.setItem(ENDPOINT_STORAGE_KEY, slug)
  } catch {
    // Safari private mode and quota errors: swallow and no-op.
  }
}

export function clearStoredSlug(): void {
  try {
    localStorage.removeItem(ENDPOINT_STORAGE_KEY)
  } catch {
    // Swallow and no-op.
  }
}

export async function createEndpoint(): Promise<Endpoint> {
  const response = await fetch('/api/endpoints/', { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Failed to create endpoint: ${response.status}`)
  }
  return (await response.json()) as Endpoint
}
