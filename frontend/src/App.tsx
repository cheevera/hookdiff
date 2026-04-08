import { Route, Routes } from 'react-router'
import { EndpointBootstrap } from './components/EndpointBootstrap'
import { EndpointView } from './components/EndpointView'
import { ErrorBoundary } from './components/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col">
        <Routes>
          <Route path="/" element={<EndpointBootstrap />} />
          <Route path="/:slug" element={<EndpointView />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}
