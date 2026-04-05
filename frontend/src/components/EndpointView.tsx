import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCreateEndpoint } from '../hooks/useCreateEndpoint'
import { clearStoredSlug, writeStoredSlug } from '../lib/endpoint'
import { DetailPanel } from './DetailPanel'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function EndpointView() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const mutation = useCreateEndpoint()

  // Keep localStorage in sync with the currently viewed endpoint so reloads
  // land on the last viewed slug.
  useEffect(() => {
    if (slug) writeStoredSlug(slug)
  }, [slug])

  if (!slug) {
    return null
  }

  const url = `http://localhost:8000/hooks/${slug}/`

  const handleNewEndpoint = () => {
    clearStoredSlug()
    mutation.mutate(undefined, {
      onSuccess: (endpoint) => navigate(`/${endpoint.slug}`, { replace: false }),
    })
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
