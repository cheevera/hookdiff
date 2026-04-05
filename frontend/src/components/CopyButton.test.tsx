import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { CopyButton } from './CopyButton'

test('clicking the copy button writes to the clipboard and shows a toast', async () => {
  const user = userEvent.setup()
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

  renderWithProviders(<CopyButton text="hello world" />)

  await user.click(screen.getByRole('button', { name: /copy/i }))

  expect(writeText).toHaveBeenCalledWith('hello world')
  expect(await screen.findByText('Copied!')).toBeInTheDocument()

  writeText.mockRestore()
})
