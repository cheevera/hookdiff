import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'

vi.mock('../fixtures/requests', () => ({
  HARDCODED_REQUESTS: [],
}))

test('renders the empty state when there is no request to show', async () => {
  const { DetailPanel } = await import('./DetailPanel')
  renderWithProviders(<DetailPanel />)
  expect(screen.getByText(/no request selected/i)).toBeInTheDocument()
})
