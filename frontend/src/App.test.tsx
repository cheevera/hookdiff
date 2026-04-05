import { screen } from '@testing-library/react'
import { App } from './App'
import { renderWithRouter } from './test/utils'

test('renders the app title', () => {
  renderWithRouter(<App />)
  expect(screen.getByText('Hookdiff')).toBeInTheDocument()
})
