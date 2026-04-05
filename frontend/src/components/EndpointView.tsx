import { useParams } from 'react-router'
import { DetailPanel } from './DetailPanel'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function EndpointView() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) {
    return null
  }
  const url = `http://localhost:8000/hooks/${slug}/`
  const handleNewEndpoint = () => {
    console.log('new endpoint clicked (stub)')
  }
  return (
    <>
      <Header url={url} onNewEndpoint={handleNewEndpoint} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <DetailPanel />
      </div>
    </>
  )
}
