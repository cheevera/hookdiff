import { screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { App } from './App'
import { MOCK_REQUESTS } from './mocks/fixtures'
import { renderWithProviders } from './test/utils'

const TEST_SLUG = 'a3f9bc2d'
const TEST_URL = `http://localhost:8000/hooks/${TEST_SLUG}/`

async function waitForShiki(container: HTMLElement) {
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
}

test('renders the endpoint URL in the header', async () => {
  const { container } = renderWithProviders(<App />, { initialEntries: [`/${TEST_SLUG}`] })
  expect(screen.getByText(TEST_URL)).toBeInTheDocument()
  await waitForShiki(container)
})

test('renders a method badge for each request', async () => {
  const { container } = renderWithProviders(<App />, { initialEntries: [`/${TEST_SLUG}`] })
  const firstMethod = MOCK_REQUESTS[0]?.method
  if (!firstMethod) throw new Error('fixture is empty')
  const badges = await screen.findAllByText(firstMethod)
  expect(badges.length).toBeGreaterThan(0)
  await waitForShiki(container)
})

test('renders the detail panel body JSON', async () => {
  const { container } = renderWithProviders(<App />, { initialEntries: [`/${TEST_SLUG}`] })
  await waitForShiki(container)
  const allShikiText = Array.from(container.querySelectorAll('pre.shiki'))
    .map((p) => p.textContent ?? '')
    .join('\n')
  expect(allShikiText).toContain('payment_intent.succeeded')
})
