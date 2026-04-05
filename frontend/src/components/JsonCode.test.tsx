import { waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { JsonCode } from './JsonCode'

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
