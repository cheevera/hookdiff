import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function ThrowingChild(): never {
  throw new Error('test error')
}

test('renders children when there is no error', () => {
  render(
    <ErrorBoundary>
      <p>Hello world</p>
    </ErrorBoundary>,
  )
  expect(screen.getByText('Hello world')).toBeInTheDocument()
})

test('catches a render error and shows the fallback UI', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <ErrorBoundary>
      <ThrowingChild />
    </ErrorBoundary>,
  )

  expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()

  spy.mockRestore()
})

test('reload button calls window.location.reload', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const reloadMock = vi.fn()
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload: reloadMock },
    writable: true,
    configurable: true,
  })

  const user = userEvent.setup()

  render(
    <ErrorBoundary>
      <ThrowingChild />
    </ErrorBoundary>,
  )

  await user.click(screen.getByRole('button', { name: /reload/i }))
  expect(reloadMock).toHaveBeenCalled()

  spy.mockRestore()
})
