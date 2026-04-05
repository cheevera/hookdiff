export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type WebhookRequest = {
  id: string
  method: HttpMethod
  headers: Record<string, string>
  body: unknown
  queryParams: Record<string, string>
  receivedAt: string
}
