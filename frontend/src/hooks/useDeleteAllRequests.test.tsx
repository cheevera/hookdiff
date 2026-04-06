import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { expect, test } from 'vitest'
import { server } from '../mocks/server'
import type { WebhookRequest } from '../types/request'
import { useDeleteAllRequests } from './useDeleteAllRequests'

function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const requests: WebhookRequest[] = [
  {
    id: 'req_a',
    method: 'POST',
    headers: {},
    body: { a: 1 },
    queryParams: {},
    receivedAt: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 'req_b',
    method: 'GET',
    headers: {},
    body: null,
    queryParams: {},
    receivedAt: '2026-04-05T11:00:00.000Z',
  },
]

test('optimistically clears all requests from the cache', async () => {
  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'testslug'], [...requests])

  const { result } = renderHook(() => useDeleteAllRequests('testslug'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    result.current.mutate()
  })

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  const cached = queryClient.getQueryData<WebhookRequest[]>(['requests', 'testslug'])
  expect(cached).toEqual([])
})

test('rolls back the cache on server error', async () => {
  server.use(
    http.delete('/api/endpoints/:slug/requests/', () => new HttpResponse(null, { status: 500 })),
  )

  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'testslug'], [...requests])

  const { result } = renderHook(() => useDeleteAllRequests('testslug'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    result.current.mutate()
  })

  await waitFor(() => {
    expect(result.current.isError).toBe(true)
  })

  const cached = queryClient.getQueryData<WebhookRequest[]>(['requests', 'testslug'])
  expect(cached).toEqual(requests)
})
