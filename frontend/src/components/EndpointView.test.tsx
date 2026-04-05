import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { App } from '../App'
import { ENDPOINT_STORAGE_KEY } from '../lib/endpoint'
import { server } from '../mocks/server'
import { renderWithProviders } from '../test/utils'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

test('clicking New Endpoint creates a new endpoint, updates localStorage, and navigates to the new slug', async () => {
  server.use(
    http.post('/api/endpoints/', () =>
      HttpResponse.json({
        slug: 'freshnew',
        url: 'http://localhost:8000/hooks/freshnew/',
        createdAt: '2026-04-05T00:00:00.000Z',
      }),
    ),
  )

  const user = userEvent.setup()
  renderWithProviders(<App />, { initialEntries: ['/oldslug1'] })

  // Starts on the old slug.
  expect(screen.getByText('http://localhost:8000/hooks/oldslug1/')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /new endpoint/i }))

  await waitFor(() => {
    expect(screen.getByText('http://localhost:8000/hooks/freshnew/')).toBeInTheDocument()
  })
  expect(screen.queryByText('http://localhost:8000/hooks/oldslug1/')).not.toBeInTheDocument()
  await waitFor(() => {
    expect(localStorage.getItem(ENDPOINT_STORAGE_KEY)).toBe('freshnew')
  })
})
