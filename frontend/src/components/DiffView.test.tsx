import { screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../test/utils'
import type { WebhookRequest } from '../types/request'
import { DiffView } from './DiffView'

const PREVIOUS: WebhookRequest = {
  id: 'prev_01',
  method: 'POST',
  headers: {},
  body: { amount: 100, status: 'pending', removed: 'gone' },
  queryParams: {},
  receivedAt: '2026-04-05T14:00:00.000Z',
}

const CURRENT: WebhookRequest = {
  id: 'curr_01',
  method: 'POST',
  headers: {},
  body: { amount: 200, status: 'completed', added: 'new' },
  queryParams: {},
  receivedAt: '2026-04-05T14:05:00.000Z',
}

test('renders changed, added, and removed entries', () => {
  renderWithProviders(<DiffView current={CURRENT} previous={PREVIOUS} />)

  // Paths rendered in <code> elements
  expect(screen.getByText('amount', { selector: 'code' })).toBeInTheDocument()
  expect(screen.getByText('status', { selector: 'code' })).toBeInTheDocument()
  expect(screen.getByText('removed', { selector: 'code' })).toBeInTheDocument()
  expect(screen.getByText('added', { selector: 'code' })).toBeInTheDocument()

  // Type badges rendered in <span> elements
  const changedBadges = screen.getAllByText('changed', { selector: 'span' })
  expect(changedBadges).toHaveLength(2)
  expect(screen.getByText('added', { selector: 'span' })).toBeInTheDocument()
  expect(screen.getByText('removed', { selector: 'span' })).toBeInTheDocument()
})

test('shows "No differences" when bodies are identical', () => {
  const same: WebhookRequest = { ...PREVIOUS, id: 'same_01' }
  renderWithProviders(<DiffView current={same} previous={PREVIOUS} />)
  expect(screen.getByText('No differences')).toBeInTheDocument()
})

test('renders two-column body view with Previous and Current labels', async () => {
  const { container } = renderWithProviders(<DiffView current={CURRENT} previous={PREVIOUS} />)
  expect(screen.getByText('Previous')).toBeInTheDocument()
  expect(screen.getByText('Current')).toBeInTheDocument()

  await waitFor(() => {
    const pres = container.querySelectorAll('pre.shiki')
    expect(pres.length).toBe(2)
  })
})

test('renders timestamps in the two-column view', () => {
  renderWithProviders(<DiffView current={CURRENT} previous={PREVIOUS} />)
  const prevFormatted = new Date('2026-04-05T14:00:00.000Z').toLocaleString()
  const currFormatted = new Date('2026-04-05T14:05:00.000Z').toLocaleString()
  expect(screen.getByText(prevFormatted)).toBeInTheDocument()
  expect(screen.getByText(currFormatted)).toBeInTheDocument()
})

test('non-object bodies: shows atomic changed entry', () => {
  const prev: WebhookRequest = { ...PREVIOUS, body: 'hello' }
  const curr: WebhookRequest = { ...CURRENT, body: 'world' }
  renderWithProviders(<DiffView current={curr} previous={prev} />)
  expect(screen.getByText('(body)')).toBeInTheDocument()
  expect(screen.getByText('changed')).toBeInTheDocument()
})

test('non-object bodies: identical non-objects show no differences', () => {
  const prev: WebhookRequest = { ...PREVIOUS, body: [1, 2, 3] }
  const curr: WebhookRequest = { ...CURRENT, body: [1, 2, 3] }
  renderWithProviders(<DiffView current={curr} previous={prev} />)
  expect(screen.getByText('No differences')).toBeInTheDocument()
})

test('mixed body types: one object, one non-object', () => {
  const prev: WebhookRequest = { ...PREVIOUS, body: { a: 1 } }
  const curr: WebhookRequest = { ...CURRENT, body: 'flat' }
  renderWithProviders(<DiffView current={curr} previous={prev} />)
  expect(screen.getByText('(body)')).toBeInTheDocument()
  expect(screen.getByText('changed')).toBeInTheDocument()
})

test('displays old and new values for changed entries', () => {
  renderWithProviders(<DiffView current={CURRENT} previous={PREVIOUS} />)
  expect(screen.getByText('100')).toBeInTheDocument()
  expect(screen.getByText('200')).toBeInTheDocument()
})

test('displays value for added entries', () => {
  renderWithProviders(<DiffView current={CURRENT} previous={PREVIOUS} />)
  expect(screen.getByText('"new"')).toBeInTheDocument()
})

test('displays value for removed entries', () => {
  renderWithProviders(<DiffView current={CURRENT} previous={PREVIOUS} />)
  expect(screen.getByText('"gone"')).toBeInTheDocument()
})

test('null body treated as non-object and compared atomically', () => {
  const prev: WebhookRequest = { ...PREVIOUS, body: null }
  const curr: WebhookRequest = { ...CURRENT, body: { a: 1 } }
  renderWithProviders(<DiffView current={curr} previous={prev} />)
  expect(screen.getByText('(body)')).toBeInTheDocument()
  expect(screen.getByText('changed')).toBeInTheDocument()
})
