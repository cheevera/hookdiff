import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { expect, test, vi } from 'vitest'
import { server } from '../mocks/server'
import type { WebhookRequest } from '../types/request'
import { useDeleteRequest } from './useDeleteRequest'

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

test('optimistically removes the deleted request from the cache', async () => {
  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'testslug'], [...requests])

  const { result } = renderHook(() => useDeleteRequest('testslug'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    result.current.mutate('req_a')
  })

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  const cached = queryClient.getQueryData<WebhookRequest[]>(['requests', 'testslug'])
  expect(cached).toEqual([requests[1]])
})

test('rolls back the cache and shows error toast on server error', async () => {
  const toastError = vi.spyOn(toast, 'error')
  server.use(
    http.delete(
      '/api/endpoints/:slug/requests/:id/',
      () => new HttpResponse(null, { status: 500 }),
    ),
  )

  const queryClient = makeQueryClient()
  queryClient.setQueryData(['requests', 'testslug'], [...requests])

  const { result } = renderHook(() => useDeleteRequest('testslug'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    result.current.mutate('req_a')
  })

  await waitFor(() => {
    expect(result.current.isError).toBe(true)
  })

  const cached = queryClient.getQueryData<WebhookRequest[]>(['requests', 'testslug'])
  expect(cached).toEqual(requests)
  expect(toastError).toHaveBeenCalledWith('Failed to delete request')
})

test('handles delete when cache is undefined (no prior data)', async () => {
  const queryClient = makeQueryClient()
  // Do NOT seed the cache — the `old` parameter will be undefined.

  const { result } = renderHook(() => useDeleteRequest('emptyslug'), {
    wrapper: makeWrapper(queryClient),
  })

  await act(async () => {
    result.current.mutate('req_a')
  })

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  const cached = queryClient.getQueryData<WebhookRequest[]>(['requests', 'emptyslug'])
  expect(cached).toEqual([])
})
