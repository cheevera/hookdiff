import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { App } from '../App'
import { ENDPOINT_STORAGE_KEY } from '../lib/endpoint'
import { server } from '../mocks/server'
import { renderWithProviders } from '../test/utils'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('creates a new endpoint and navigates to its slug when localStorage is empty', async () => {
  let callCount = 0
  server.use(
    http.post('/api/endpoints/', () => {
      callCount += 1
      return HttpResponse.json({
        slug: 'newslug1',
        url: 'http://localhost:5173/hooks/newslug1/',
        createdAt: '2026-04-05T00:00:00.000Z',
      })
    }),
  )

  renderWithProviders(<App />, { initialEntries: ['/'] })

  await waitFor(() => {
    expect(screen.getByText('http://localhost:5173/hooks/newslug1/')).toBeInTheDocument()
  })
  expect(localStorage.getItem(ENDPOINT_STORAGE_KEY)).toBe('newslug1')
  expect(callCount).toBe(1)
})

test('redirects to the stored slug without hitting the API when localStorage has a slug', async () => {
  let callCount = 0
  server.use(
    http.post('/api/endpoints/', () => {
      callCount += 1
      return HttpResponse.json({
        slug: 'shouldnothappen',
        url: 'http://localhost:5173/hooks/shouldnothappen/',
        createdAt: '2026-04-05T00:00:00.000Z',
      })
    }),
  )
  localStorage.setItem(ENDPOINT_STORAGE_KEY, 'existing1')

  renderWithProviders(<App />, { initialEntries: ['/'] })

  await waitFor(() => {
    expect(screen.getByText('http://localhost:5173/hooks/existing1/')).toBeInTheDocument()
  })
  expect(callCount).toBe(0)
})

test('shows an error state with retry when creation fails, then succeeds on retry', async () => {
  // Silence the expected fetch failure noise.
  vi.spyOn(console, 'error').mockImplementation(() => {})

  let attempt = 0
  server.use(
    http.post('/api/endpoints/', () => {
      attempt += 1
      if (attempt === 1) {
        return new HttpResponse(null, { status: 500 })
      }
      return HttpResponse.json({
        slug: 'retry01x',
        url: 'http://localhost:5173/hooks/retry01x/',
        createdAt: '2026-04-05T00:00:00.000Z',
      })
    }),
  )

  const user = userEvent.setup()
  renderWithProviders(<App />, { initialEntries: ['/'] })

  const retryButton = await screen.findByRole('button', { name: /retry/i })
  expect(screen.getByText(/Failed to create endpoint/i)).toBeInTheDocument()

  await user.click(retryButton)

  await waitFor(() => {
    expect(screen.getByText('http://localhost:5173/hooks/retry01x/')).toBeInTheDocument()
  })
  expect(attempt).toBe(2)
})

test('shows a loading state while the mutation is in flight', async () => {
  let resolve: (() => void) | undefined
  const waitForMe = new Promise<void>((r) => {
    resolve = r
  })
  server.use(
    http.post('/api/endpoints/', async () => {
      await waitForMe
      return HttpResponse.json({
        slug: 'delayed1',
        url: 'http://localhost:5173/hooks/delayed1/',
        createdAt: '2026-04-05T00:00:00.000Z',
      })
    }),
  )

  renderWithProviders(<App />, { initialEntries: ['/'] })

  expect(screen.getByText(/Creating endpoint/i)).toBeInTheDocument()

  resolve?.()

  await waitFor(() => {
    expect(screen.queryByText(/Creating endpoint/i)).not.toBeInTheDocument()
  })
  expect(screen.getByText('http://localhost:5173/hooks/delayed1/')).toBeInTheDocument()
})
