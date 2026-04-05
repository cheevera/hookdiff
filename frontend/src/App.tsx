import { DetailPanel } from './components/DetailPanel'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <DetailPanel />
      </div>
    </div>
  )
}
