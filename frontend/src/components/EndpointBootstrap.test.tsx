import { screen, waitFor } from '@testing-library/react'
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

test('creates a new endpoint and navigates to its slug when localStorage is empty', async () => {
  let callCount = 0
  server.use(
    http.post('/api/endpoints/', () => {
      callCount += 1
      return HttpResponse.json({
        slug: 'newslug1',
        url: 'http://localhost:8000/hooks/newslug1/',
        createdAt: '2026-04-05T00:00:00.000Z',
      })
    }),
  )

  renderWithProviders(<App />, { initialEntries: ['/'] })

  await waitFor(() => {
    expect(screen.getByText('http://localhost:8000/hooks/newslug1/')).toBeInTheDocument()
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
        url: 'http://localhost:8000/hooks/shouldnothappen/',
        createdAt: '2026-04-05T00:00:00.000Z',
      })
    }),
  )
  localStorage.setItem(ENDPOINT_STORAGE_KEY, 'existing1')

  renderWithProviders(<App />, { initialEntries: ['/'] })

  await waitFor(() => {
    expect(screen.getByText('http://localhost:8000/hooks/existing1/')).toBeInTheDocument()
  })
  expect(callCount).toBe(0)
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
        url: 'http://localhost:8000/hooks/delayed1/',
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
  expect(screen.getByText('http://localhost:8000/hooks/delayed1/')).toBeInTheDocument()
})
