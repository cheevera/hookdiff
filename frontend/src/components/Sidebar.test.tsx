import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Sidebar } from '@/components/Sidebar'
import { renderWithProviders } from '@/test/utils'
import type { WebhookRequest } from '@/types/request'

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

const defaultProps = {
  requests: sampleRequests,
  isLoading: false,
  isError: false,
  selectedId: 'req_a' as string | null,
  onSelect: () => {},
  onDelete: () => {},
  onClearAll: () => {},
  newCount: 0,
  onJumpToLatest: () => {},
}

test('renders each request with its method badge and body preview', () => {
  renderWithProviders(<Sidebar {...defaultProps} />)
  expect(screen.getByText('POST')).toBeInTheDocument()
  expect(screen.getByText('PUT')).toBeInTheDocument()
  expect(screen.getByText('{"kind":"alpha"}')).toBeInTheDocument()
  expect(screen.getByText('{"kind":"beta"}')).toBeInTheDocument()
})

test('marks the selected request with data-selected=true on its button', () => {
  renderWithProviders(<Sidebar {...defaultProps} selectedId="req_b" />)
  const buttons = screen.getAllByRole('button')
  const selectedButtons = buttons.filter((b) => b.getAttribute('data-selected') === 'true')
  expect(selectedButtons).toHaveLength(1)
  // The selected button should contain the PUT badge (req_b).
  expect(selectedButtons[0]?.textContent).toContain('PUT')
})

test('calls onSelect with the clicked request id', async () => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  renderWithProviders(<Sidebar {...defaultProps} onSelect={onSelect} />)
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
  renderWithProviders(<Sidebar {...defaultProps} requests={requests} selectedId={null} />)
  expect(screen.getByText('[object Object]')).toBeInTheDocument()
})

test('shows a loading message while the query is pending', () => {
  renderWithProviders(
    <Sidebar {...defaultProps} requests={[]} isLoading={true} selectedId={null} />,
  )
  expect(screen.getByText(/loading requests/i)).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

test('shows an error message when the query fails', () => {
  renderWithProviders(<Sidebar {...defaultProps} requests={[]} isError={true} selectedId={null} />)
  expect(screen.getByText(/failed to load requests/i)).toBeInTheDocument()
})

test('shows an empty state when there are no requests', () => {
  renderWithProviders(<Sidebar {...defaultProps} requests={[]} selectedId={null} />)
  expect(screen.getByText(/no requests yet/i)).toBeInTheDocument()
})

test('shows a header with request count and last-received time', () => {
  renderWithProviders(<Sidebar {...defaultProps} />)
  expect(screen.getByText('2 requests')).toBeInTheDocument()
  expect(screen.getByText(/^Last:/)).toBeInTheDocument()
})

test('truncates body previews longer than PREVIEW_MAX_LEN with an ellipsis', () => {
  const longText = 'x'.repeat(200)
  const requests: WebhookRequest[] = [
    {
      id: 'req_long',
      method: 'POST',
      headers: {},
      body: { payload: longText },
      queryParams: {},
      receivedAt: '2026-04-05T12:00:00.000Z',
    },
  ]
  renderWithProviders(<Sidebar {...defaultProps} requests={requests} selectedId={null} />)
  const previews = screen.getAllByText(/x+…$/)
  expect(previews.length).toBeGreaterThan(0)
  const preview = previews[0]
  if (!preview) throw new Error('expected a truncated preview')
  expect(preview.textContent?.endsWith('…')).toBe(true)
  expect((preview.textContent ?? '').length).toBeLessThanOrEqual(81)
})

test('renders the N-new-requests badge and jump button when newCount > 0', () => {
  renderWithProviders(<Sidebar {...defaultProps} newCount={3} />)
  expect(screen.getByText('3 new requests')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /jump to latest/i })).toBeInTheDocument()
})

test('uses singular "request" when newCount === 1', () => {
  renderWithProviders(<Sidebar {...defaultProps} newCount={1} />)
  expect(screen.getByText('1 new request')).toBeInTheDocument()
})

test('hides the badge and jump button when newCount === 0', () => {
  renderWithProviders(<Sidebar {...defaultProps} />)
  expect(screen.queryByText(/new request/i)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument()
})

test('calls onJumpToLatest when the jump button is clicked', async () => {
  const user = userEvent.setup()
  const onJumpToLatest = vi.fn()
  renderWithProviders(<Sidebar {...defaultProps} newCount={2} onJumpToLatest={onJumpToLatest} />)
  await user.click(screen.getByRole('button', { name: /jump to latest/i }))
  expect(onJumpToLatest).toHaveBeenCalledTimes(1)
})

test('renders a delete button on each request entry', () => {
  renderWithProviders(<Sidebar {...defaultProps} />)
  const deleteButtons = screen.getAllByRole('button', { name: /delete request/i })
  expect(deleteButtons).toHaveLength(2)
})

test('clicking delete calls onDelete with the correct id', async () => {
  const user = userEvent.setup()
  const onDelete = vi.fn()
  renderWithProviders(<Sidebar {...defaultProps} onDelete={onDelete} />)
  const deleteButtons = screen.getAllByRole('button', { name: /delete request/i })
  // First delete button is for req_a (first item).
  await user.click(deleteButtons[0] as HTMLElement)
  expect(onDelete).toHaveBeenCalledWith('req_a')
})

test('clicking delete does not call onSelect (stopPropagation)', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  const onDelete = vi.fn()
  renderWithProviders(<Sidebar {...defaultProps} onSelect={onSelect} onDelete={onDelete} />)
  const deleteButtons = screen.getAllByRole('button', { name: /delete request/i })
  await user.click(deleteButtons[0] as HTMLElement)
  expect(onDelete).toHaveBeenCalledTimes(1)
  expect(onSelect).not.toHaveBeenCalled()
})

test('shows "Clear all" button in the header when requests exist', () => {
  renderWithProviders(<Sidebar {...defaultProps} />)
  expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
})

test('clicking "Clear all" when confirm returns true calls onClearAll', async () => {
  const user = userEvent.setup()
  const onClearAll = vi.fn()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  renderWithProviders(<Sidebar {...defaultProps} onClearAll={onClearAll} />)
  await user.click(screen.getByRole('button', { name: /clear all/i }))
  expect(window.confirm).toHaveBeenCalledWith('Delete all requests?')
  expect(onClearAll).toHaveBeenCalledTimes(1)
})

test('clicking "Clear all" when confirm returns false does not call onClearAll', async () => {
  const user = userEvent.setup()
  const onClearAll = vi.fn()
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  renderWithProviders(<Sidebar {...defaultProps} onClearAll={onClearAll} />)
  await user.click(screen.getByRole('button', { name: /clear all/i }))
  expect(window.confirm).toHaveBeenCalledWith('Delete all requests?')
  expect(onClearAll).not.toHaveBeenCalled()
})

test('pressing Enter on a sidebar item calls onSelect', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  renderWithProviders(<Sidebar {...defaultProps} onSelect={onSelect} />)
  const items = screen.getAllByRole('button')
  const postItem = items.find(
    (b) => b.textContent?.includes('POST') && b.getAttribute('tabindex') === '0',
  )
  if (!postItem) throw new Error('expected a POST sidebar item')
  postItem.focus()
  await user.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledWith('req_a')
})

test('pressing Space on a sidebar item calls onSelect', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  renderWithProviders(<Sidebar {...defaultProps} onSelect={onSelect} />)
  const items = screen.getAllByRole('button')
  const postItem = items.find(
    (b) => b.textContent?.includes('POST') && b.getAttribute('tabindex') === '0',
  )
  if (!postItem) throw new Error('expected a POST sidebar item')
  postItem.focus()
  await user.keyboard(' ')
  expect(onSelect).toHaveBeenCalledWith('req_a')
})
