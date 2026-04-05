import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HARDCODED_REQUESTS } from '../fixtures/requests'
import { useCreateEndpoint } from '../hooks/useCreateEndpoint'
import { clearStoredSlug, writeStoredSlug } from '../lib/endpoint'
import { DetailPanel } from './DetailPanel'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function EndpointView() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const mutation = useCreateEndpoint()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Keep localStorage in sync with the currently viewed endpoint so reloads
  // land on the last viewed slug.
  useEffect(() => {
    if (slug) writeStoredSlug(slug)
  }, [slug])

  // Default selection: keep `selectedId` pointing at an item in the current
  // list whenever the slug changes or the list arrives.
  useEffect(() => {
    if (HARDCODED_REQUESTS.some((r) => r.id === selectedId)) return
    setSelectedId(HARDCODED_REQUESTS[0].id)
  }, [selectedId])

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

  const selectedRequest = HARDCODED_REQUESTS.find((r) => r.id === selectedId) ?? null

  return (
    <>
      <Header url={url} onNewEndpoint={handleNewEndpoint} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar requests={HARDCODED_REQUESTS} selectedId={selectedId} onSelect={setSelectedId} />
        <DetailPanel request={selectedRequest} />
      </div>
    </>
  )
}
