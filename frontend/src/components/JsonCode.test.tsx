import { waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JsonCode } from '@/components/JsonCode'
import * as shikiLib from '@/lib/shiki'
import { renderWithProviders } from '@/test/utils'

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders shiki highlighted JSON tokens', async () => {
  const { container } = renderWithProviders(
    <JsonCode value={{ hello: 'world', count: 42 }} theme="light" />,
  )

  await waitFor(() => {
    const shikiPre = container.querySelector('pre.shiki')
    expect(shikiPre).not.toBeNull()
  })

  const shikiPre = container.querySelector('pre.shiki')
  if (!shikiPre) throw new Error('expected shiki pre element')
  const tokenSpans = shikiPre.querySelectorAll('span[style*="color"]')
  expect(tokenSpans.length).toBeGreaterThan(0)
  expect(shikiPre.textContent).toContain('"hello"')
})

test('renders the dark theme variant', async () => {
  const { container } = renderWithProviders(<JsonCode value={{ hello: 'world' }} theme="dark" />)
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
})

test('falls back to "null" when the value cannot be stringified', async () => {
  const { container } = renderWithProviders(<JsonCode value={undefined} theme="light" />)
  await waitFor(() => {
    expect(container.querySelector('pre.shiki')).not.toBeNull()
  })
  const shikiPre = container.querySelector('pre.shiki')
  if (!shikiPre) throw new Error('expected shiki pre element')
  expect(shikiPre.textContent).toContain('null')
})

test('skips the state update when unmounted before the highlighter resolves', async () => {
  let resolveHighlighter: ((value: unknown) => void) | undefined
  const pending = new Promise((resolve) => {
    resolveHighlighter = resolve
  })
  vi.spyOn(shikiLib, 'getHighlighter').mockReturnValue(
    pending as ReturnType<typeof shikiLib.getHighlighter>,
  )

  const { unmount } = renderWithProviders(<JsonCode value={{ hello: 'world' }} theme="light" />)
  unmount()

  // Resolve after unmount so the cleanup has set `cancelled = true` first.
  resolveHighlighter?.({
    codeToHtml: () => '<pre class="shiki">ignored</pre>',
  })

  // Flush the microtask queue so the `.then` callback runs and hits the guard.
  await Promise.resolve()
  await Promise.resolve()
})
