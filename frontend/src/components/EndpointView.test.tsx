import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { App } from '../App'
import { ENDPOINT_STORAGE_KEY } from '../lib/endpoint'
import { MOCK_REQUESTS } from '../mocks/fixtures'
import { server } from '../mocks/server'
import { renderWithProviders } from '../test/utils'
import { EndpointView } from './EndpointView'

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

test('clicking a sidebar item updates the detail panel', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<App />, { initialEntries: ['/a3f9bc2d'] })

  // Wait for the initial Shiki render (default: first request selected).
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const firstBodyMarker = 'payment_intent.succeeded'
  expect(container.querySelector('pre.shiki')?.textContent).toContain(firstBodyMarker)

  // Click the button for the second mock request (PUT, userId 918).
  const secondRequest = MOCK_REQUESTS[1]
  if (!secondRequest) throw new Error('expected at least two mock requests')
  const buttons = screen.getAllByRole('button')
  const target = buttons.find((b) => b.textContent?.includes('918'))
  if (!target) throw new Error('expected a sidebar button for the second request')
  await user.click(target)

  // Detail panel re-renders through Shiki with the new request body.
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')?.textContent).toContain('Ada Lovelace')
  })
  expect(container.querySelector('pre.shiki')?.textContent).not.toContain(firstBodyMarker)
})

test('EndpointView renders nothing when the route has no slug param', () => {
  // Mount EndpointView on a route that does not define `:slug` so useParams()
  // returns undefined and the guard branch is exercised.
  renderWithProviders(
    <Routes>
      <Route path="/" element={<EndpointView />} />
    </Routes>,
    { initialEntries: ['/'] },
  )
  // The view is a guard-return, so none of its children should render.
  expect(screen.queryByText('Hookdiff')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /new endpoint/i })).not.toBeInTheDocument()
})
