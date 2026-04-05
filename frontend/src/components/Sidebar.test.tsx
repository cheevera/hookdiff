import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'

type CircularBody = { self: unknown }
const circular: CircularBody = { self: null }
circular.self = circular

vi.mock('../fixtures/requests', () => ({
  HARDCODED_REQUESTS: [
    {
      id: 'req_circ',
      method: 'POST',
      headers: {},
      body: circular,
      queryParams: {},
      receivedAt: '2026-04-05T00:00:00.000Z',
    },
  ],
}))

test('bodyPreview falls back to String(body) when JSON.stringify throws', async () => {
  const { Sidebar } = await import('./Sidebar')
  renderWithProviders(<Sidebar />)
  // String({self: ...}) → "[object Object]"
  expect(screen.getByText('[object Object]')).toBeInTheDocument()
})
