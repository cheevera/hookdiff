import { render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import * as env from '@/lib/env'

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders nothing when not in dev mode', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(false)
  const { container } = render(<ConnectionStatus status="open" />)
  expect(container.firstChild).toBeNull()
})

test('renders a yellow dot and "Connecting…" label when connecting', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(true)
  const { container, getByText } = render(<ConnectionStatus status="connecting" />)
  expect(getByText('Connecting…')).toBeInTheDocument()
  expect(container.querySelector('.bg-yellow-500')).not.toBeNull()
})

test('renders a green dot and "Connected" label when open', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(true)
  const { container, getByText } = render(<ConnectionStatus status="open" />)
  expect(getByText('Connected')).toBeInTheDocument()
  expect(container.querySelector('.bg-green-500')).not.toBeNull()
})

test('renders a red dot and "Disconnected" label when closed', () => {
  vi.spyOn(env, 'isDev').mockReturnValue(true)
  const { container, getByText } = render(<ConnectionStatus status="closed" />)
  expect(getByText('Disconnected')).toBeInTheDocument()
  expect(container.querySelector('.bg-red-500')).not.toBeNull()
})
