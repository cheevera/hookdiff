import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { ThemeToggle } from '@/components/ThemeToggle'
import { renderWithProviders } from '@/test/utils'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

test('clicking the toggle flips the dark class and updates localStorage', async () => {
  const user = userEvent.setup()
  renderWithProviders(<ThemeToggle />)

  expect(document.documentElement.classList.contains('dark')).toBe(false)

  await user.click(screen.getByRole('button'))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(localStorage.getItem('hookdiff-theme')).toBe('dark')

  await user.click(screen.getByRole('button'))
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  expect(localStorage.getItem('hookdiff-theme')).toBe('light')
})
