import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import {
  createEndpoint,
  deleteAllRequests,
  deleteRequest,
  fetchRequests,
  sendTestRequest,
} from '@/lib/api'
import { server } from '@/mocks/server'
import type { WebhookRequest } from '@/types/request'

test('createEndpoint returns the parsed endpoint on success', async () => {
  server.use(
    http.post('/api/endpoints/', () =>
      HttpResponse.json({
        slug: 'okslug01',
        url: 'http://localhost:5173/hooks/okslug01/',
        createdAt: '2026-04-05T00:00:00.000Z',
      }),
    ),
  )
  const endpoint = await createEndpoint()
  expect(endpoint.slug).toBe('okslug01')
  expect(endpoint.url).toBe('http://localhost:5173/hooks/okslug01/')
  expect(endpoint.createdAt).toBe('2026-04-05T00:00:00.000Z')
})

test('createEndpoint throws when the response is not ok', async () => {
  server.use(http.post('/api/endpoints/', () => new HttpResponse(null, { status: 500 })))
  await expect(createEndpoint()).rejects.toThrow(/Failed to create endpoint: 500/)
})

test('fetchRequests returns the parsed request list on success', async () => {
  const fixture: WebhookRequest[] = [
    {
      id: 'req_ok',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { ok: true },
      queryParams: {},
      receivedAt: '2026-04-05T00:00:00.000Z',
    },
  ]
  server.use(http.get('/api/endpoints/:slug/requests/', () => HttpResponse.json(fixture)))
  const result = await fetchRequests('okslug01')
  expect(result).toEqual(fixture)
})

test('fetchRequests throws when the response is not ok', async () => {
  server.use(
    http.get('/api/endpoints/:slug/requests/', () => new HttpResponse(null, { status: 500 })),
  )
  await expect(fetchRequests('badslug1')).rejects.toThrow(/Failed to fetch requests: 500/)
})

test('sendTestRequest posts to the webhook endpoint', async () => {
  server.use(http.post('/hooks/:slug/', () => HttpResponse.json({ success: true })))
  await expect(sendTestRequest('myslug01')).resolves.toBeUndefined()
})

test('sendTestRequest throws when the response is not ok', async () => {
  server.use(http.post('/hooks/:slug/', () => new HttpResponse(null, { status: 500 })))
  await expect(sendTestRequest('badslug1')).rejects.toThrow(/Failed to send test request: 500/)
})

test('deleteRequest resolves on 204', async () => {
  server.use(
    http.delete(
      '/api/endpoints/:slug/requests/:id/',
      () => new HttpResponse(null, { status: 204 }),
    ),
  )
  await expect(deleteRequest('okslug01', 'req_01')).resolves.toBeUndefined()
})

test('deleteRequest throws when the response is not ok', async () => {
  server.use(
    http.delete(
      '/api/endpoints/:slug/requests/:id/',
      () => new HttpResponse(null, { status: 500 }),
    ),
  )
  await expect(deleteRequest('badslug1', 'req_01')).rejects.toThrow(/Failed to delete request: 500/)
})

test('deleteAllRequests resolves on 204', async () => {
  server.use(
    http.delete('/api/endpoints/:slug/requests/', () => new HttpResponse(null, { status: 204 })),
  )
  await expect(deleteAllRequests('okslug01')).resolves.toBeUndefined()
})

test('deleteAllRequests throws when the response is not ok', async () => {
  server.use(
    http.delete('/api/endpoints/:slug/requests/', () => new HttpResponse(null, { status: 500 })),
  )
  await expect(deleteAllRequests('badslug1')).rejects.toThrow(/Failed to delete requests: 500/)
})
