import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import { App } from './App'
import { useTheme } from './hooks/useTheme'
import './index.css'

const queryClient = new QueryClient()

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster richColors position="bottom-right" theme={theme} />
}

async function startApp() {
  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Root element #root not found')

  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <AppToaster />
      </QueryClientProvider>
    </StrictMode>,
  )
}

startApp()
