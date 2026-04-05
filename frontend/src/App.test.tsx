import { screen } from '@testing-library/react'
import { App } from './App'
import { HARDCODED_ENDPOINT_URL, HARDCODED_REQUESTS } from './fixtures/requests'
import { renderWithProviders } from './test/utils'

test('renders the endpoint URL in the header', () => {
  renderWithProviders(<App />)
  expect(screen.getByText(HARDCODED_ENDPOINT_URL)).toBeInTheDocument()
})

test('renders a method badge for each request', () => {
  renderWithProviders(<App />)
  const firstMethod = HARDCODED_REQUESTS[0]?.method
  if (!firstMethod) throw new Error('fixture is empty')
  expect(screen.getAllByText(firstMethod).length).toBeGreaterThan(0)
})

test('renders the detail panel body JSON', () => {
  renderWithProviders(<App />)
  const firstRequest = HARDCODED_REQUESTS[0]
  if (!firstRequest) throw new Error('fixture is empty')
  const expected = JSON.stringify(firstRequest.body, null, 2)
  expect(screen.getByText((_, node) => node?.textContent === expected)).toBeInTheDocument()
})
