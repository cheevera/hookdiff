import { screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../test/utils'
import type { WebhookRequest } from '../types/request'
import { DetailPanel } from './DetailPanel'

test('renders the empty state when request is null', () => {
  renderWithProviders(<DetailPanel request={null} />)
  expect(screen.getByText(/no request selected/i)).toBeInTheDocument()
})

test('renders the method badge and body when a request is provided', async () => {
  const request: WebhookRequest = {
    id: 'req_show',
    method: 'POST',
    headers: {},
    body: { marker: 'shiki-target' },
    queryParams: {},
    receivedAt: '2026-04-05T12:00:00.000Z',
  }
  const { container } = renderWithProviders(<DetailPanel request={request} />)
  expect(screen.getByText('POST')).toBeInTheDocument()
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const shikiPre = container.querySelector('pre.shiki')
  expect(shikiPre?.textContent).toContain('shiki-target')
})
