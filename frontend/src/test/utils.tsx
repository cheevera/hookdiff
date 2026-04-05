import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, type RenderResult, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { Toaster } from 'sonner'

type ProviderOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: string[]
}

export function renderWithProviders(ui: ReactElement, options?: ProviderOptions): RenderResult {
  const { initialEntries = ['/'], ...renderOptions } = options ?? {}
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      <Toaster />
    </QueryClientProvider>
  )
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
