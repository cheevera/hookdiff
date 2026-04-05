import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCreateEndpoint } from '../hooks/useCreateEndpoint'
import { useRequests } from '../hooks/useRequests'
import { clearStoredSlug, writeStoredSlug } from '../lib/endpoint'
import { DetailPanel } from './DetailPanel'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function EndpointView() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const mutation = useCreateEndpoint()
  const { data: requests, isLoading, isError } = useRequests(slug)
  const list = requests ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Keep localStorage in sync with the currently viewed endpoint so reloads
  // land on the last viewed slug.
  useEffect(() => {
    if (slug) writeStoredSlug(slug)
  }, [slug])

  // Default selection: keep `selectedId` pointing at an item in the current
  // list whenever the slug changes or the list arrives. Empty list means
  // selection stays null and the detail panel shows its empty state.
  useEffect(() => {
    if (list.length === 0) {
      setSelectedId(null)
      return
    }
    if (list.some((r) => r.id === selectedId)) return
    setSelectedId(list[0].id)
  }, [list, selectedId])

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

  const selectedRequest = list.find((r) => r.id === selectedId) ?? null

  return (
    <>
      <Header url={url} onNewEndpoint={handleNewEndpoint} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          requests={list}
          isLoading={isLoading}
          isError={isError}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <DetailPanel request={selectedRequest} />
      </div>
    </>
  )
}
