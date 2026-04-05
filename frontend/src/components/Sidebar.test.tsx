import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import type { WebhookRequest } from '../types/request'
import { Sidebar } from './Sidebar'

const sampleRequests: WebhookRequest[] = [
  {
    id: 'req_a',
    method: 'POST',
    headers: {},
    body: { kind: 'alpha' },
    queryParams: {},
    receivedAt: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 'req_b',
    method: 'PUT',
    headers: {},
    body: { kind: 'beta' },
    queryParams: {},
    receivedAt: '2026-04-05T11:00:00.000Z',
  },
]

test('renders each request with its method badge and body preview', () => {
  renderWithProviders(<Sidebar requests={sampleRequests} selectedId="req_a" onSelect={() => {}} />)
  expect(screen.getByText('POST')).toBeInTheDocument()
  expect(screen.getByText('PUT')).toBeInTheDocument()
  expect(screen.getByText('{"kind":"alpha"}')).toBeInTheDocument()
  expect(screen.getByText('{"kind":"beta"}')).toBeInTheDocument()
})

test('marks the selected request with data-selected=true on its button', () => {
  renderWithProviders(<Sidebar requests={sampleRequests} selectedId="req_b" onSelect={() => {}} />)
  const buttons = screen.getAllByRole('button')
  const selectedButtons = buttons.filter((b) => b.getAttribute('data-selected') === 'true')
  expect(selectedButtons).toHaveLength(1)
  // The selected button should contain the PUT badge (req_b).
  expect(selectedButtons[0]?.textContent).toContain('PUT')
})

test('calls onSelect with the clicked request id', async () => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  renderWithProviders(<Sidebar requests={sampleRequests} selectedId="req_a" onSelect={onSelect} />)
  const buttons = screen.getAllByRole('button')
  const putButton = buttons.find((b) => b.textContent?.includes('PUT'))
  if (!putButton) throw new Error('expected a PUT button')
  await user.click(putButton)
  expect(onSelect).toHaveBeenCalledWith('req_b')
})

test('bodyPreview falls back to String(body) when JSON.stringify throws', () => {
  type CircularBody = { self: unknown }
  const circular: CircularBody = { self: null }
  circular.self = circular
  const requests: WebhookRequest[] = [
    {
      id: 'req_circ',
      method: 'POST',
      headers: {},
      body: circular,
      queryParams: {},
      receivedAt: '2026-04-05T00:00:00.000Z',
    },
  ]
  renderWithProviders(<Sidebar requests={requests} selectedId={null} onSelect={() => {}} />)
  expect(screen.getByText('[object Object]')).toBeInTheDocument()
})
