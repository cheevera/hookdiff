import { Route, Routes } from 'react-router'
import { EndpointView } from './components/EndpointView'

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <Routes>
        <Route path="/:slug" element={<EndpointView />} />
      </Routes>
    </div>
  )
}
