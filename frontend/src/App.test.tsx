import { screen } from '@testing-library/react'
import { App } from './App'
import { renderWithProviders } from './test/utils'

test('renders the app title', () => {
  renderWithProviders(<App />)
  expect(screen.getByText('Hookdiff')).toBeInTheDocument()
})
