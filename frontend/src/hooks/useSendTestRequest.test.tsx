import { waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { useSendTestRequest } from '@/hooks/useSendTestRequest'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/utils'

function TestHarness({ slug }: { slug: string }) {
  const mutation = useSendTestRequest(slug)
  return (
    <button type="button" onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Sending...' : mutation.isSuccess ? 'Sent' : 'Send'}
    </button>
  )
}

test('calls the webhook endpoint and reports success', async () => {
  server.use(http.post('/hooks/:slug/', () => HttpResponse.json({ success: true })))
  const { getByRole } = renderWithProviders(<TestHarness slug="testslug" />)
  getByRole('button', { name: 'Send' }).click()
  await waitFor(() => {
    expect(getByRole('button', { name: 'Sent' })).toBeInTheDocument()
  })
})

test('reports error when the request fails', async () => {
  server.use(http.post('/hooks/:slug/', () => new HttpResponse(null, { status: 500 })))
  const { getByRole } = renderWithProviders(<TestHarness slug="badslug1" />)
  getByRole('button', { name: 'Send' }).click()
  await waitFor(() => {
    expect(getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })
})
