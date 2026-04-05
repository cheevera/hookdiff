import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { server } from '../mocks/server'
import {
  clearStoredSlug,
  createEndpoint,
  ENDPOINT_STORAGE_KEY,
  readStoredSlug,
  writeStoredSlug,
} from './endpoint'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('readStoredSlug returns null when nothing is stored', () => {
  expect(readStoredSlug()).toBeNull()
})

test('readStoredSlug returns the stored value', () => {
  localStorage.setItem(ENDPOINT_STORAGE_KEY, 'abc12345')
  expect(readStoredSlug()).toBe('abc12345')
})

test('readStoredSlug returns null when localStorage.getItem throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(readStoredSlug()).toBeNull()
})

test('writeStoredSlug writes the slug to localStorage', () => {
  writeStoredSlug('hello123')
  expect(localStorage.getItem(ENDPOINT_STORAGE_KEY)).toBe('hello123')
})

test('writeStoredSlug swallows errors when localStorage.setItem throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  expect(() => writeStoredSlug('nope')).not.toThrow()
})

test('clearStoredSlug removes the stored slug', () => {
  localStorage.setItem(ENDPOINT_STORAGE_KEY, 'rem1')
  clearStoredSlug()
  expect(localStorage.getItem(ENDPOINT_STORAGE_KEY)).toBeNull()
})

test('clearStoredSlug swallows errors when localStorage.removeItem throws', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => clearStoredSlug()).not.toThrow()
})

test('createEndpoint returns the parsed endpoint on success', async () => {
  server.use(
    http.post('/api/endpoints/', () =>
      HttpResponse.json({
        slug: 'okslug01',
        url: 'http://localhost:8000/hooks/okslug01/',
        createdAt: '2026-04-05T00:00:00.000Z',
      }),
    ),
  )
  const endpoint = await createEndpoint()
  expect(endpoint.slug).toBe('okslug01')
  expect(endpoint.url).toBe('http://localhost:8000/hooks/okslug01/')
  expect(endpoint.createdAt).toBe('2026-04-05T00:00:00.000Z')
})

test('createEndpoint throws when the response is not ok', async () => {
  server.use(http.post('/api/endpoints/', () => new HttpResponse(null, { status: 500 })))
  await expect(createEndpoint()).rejects.toThrow(/Failed to create endpoint: 500/)
})
