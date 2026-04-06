import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../test/utils'
import type { WebhookRequest } from '../types/request'
import { DetailPanel } from './DetailPanel'

const BASE_REQUEST: WebhookRequest = {
  id: 'req_show',
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'user-agent': 'TestAgent/1.0',
  },
  body: { marker: 'shiki-target' },
  queryParams: { source: 'dashboard', debug: '1' },
  receivedAt: '2026-04-05T12:00:00.000Z',
}

test('renders the empty state when request is null', () => {
  renderWithProviders(<DetailPanel request={null} />)
  expect(screen.getByText(/no request selected/i)).toBeInTheDocument()
})

test('renders the method badge and body when a request is provided', async () => {
  const { container } = renderWithProviders(<DetailPanel request={BASE_REQUEST} />)
  expect(screen.getByText('POST')).toBeInTheDocument()
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const shikiPre = container.querySelector('pre.shiki')
  expect(shikiPre?.textContent).toContain('shiki-target')
})

test('headers section is collapsed by default', () => {
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)
  expect(screen.getByText('Headers (2)')).toBeInTheDocument()
  expect(screen.queryByText('content-type')).not.toBeInTheDocument()
})

test('clicking headers toggle expands and shows key-value pairs', async () => {
  const user = userEvent.setup()
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)

  await user.click(screen.getByText('Headers (2)'))

  expect(screen.getByText('content-type')).toBeInTheDocument()
  expect(screen.getByText('application/json')).toBeInTheDocument()
  expect(screen.getByText('user-agent')).toBeInTheDocument()
  expect(screen.getByText('TestAgent/1.0')).toBeInTheDocument()
})

test('query params section is hidden when queryParams is empty', () => {
  const request: WebhookRequest = { ...BASE_REQUEST, queryParams: {} }
  renderWithProviders(<DetailPanel request={request} />)
  expect(screen.queryByText(/query params/i)).not.toBeInTheDocument()
})

test('query params section is visible but collapsed when queryParams has entries', () => {
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)
  expect(screen.getByText('Query params (2)')).toBeInTheDocument()
  expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
})

test('clicking query params toggle expands and shows param key-value pairs', async () => {
  const user = userEvent.setup()
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)

  await user.click(screen.getByText('Query params (2)'))

  expect(screen.getByText('source')).toBeInTheDocument()
  expect(screen.getByText('dashboard')).toBeInTheDocument()
  expect(screen.getByText('debug')).toBeInTheDocument()
  expect(screen.getByText('1')).toBeInTheDocument()
})

test('"Detail" button is present and visually active', () => {
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)
  const detailButton = screen.getByRole('button', { name: 'Detail' })
  expect(detailButton).toBeInTheDocument()
  expect(detailButton).toBeEnabled()
})

test('"Diff" button is present and disabled', () => {
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)
  const diffButton = screen.getByRole('button', { name: 'Diff' })
  expect(diffButton).toBeInTheDocument()
  expect(diffButton).toBeDisabled()
  expect(diffButton).toHaveAttribute('title', 'Available when comparing requests')
})

test('timestamp is formatted, not raw ISO', () => {
  renderWithProviders(<DetailPanel request={BASE_REQUEST} />)
  expect(screen.queryByText('2026-04-05T12:00:00.000Z')).not.toBeInTheDocument()
  const formatted = new Date('2026-04-05T12:00:00.000Z').toLocaleString()
  expect(screen.getByText(formatted)).toBeInTheDocument()
})

test('headers section is hidden when headers is empty', () => {
  const request: WebhookRequest = { ...BASE_REQUEST, headers: {} }
  renderWithProviders(<DetailPanel request={request} />)
  expect(screen.queryByText(/headers/i)).not.toBeInTheDocument()
})
