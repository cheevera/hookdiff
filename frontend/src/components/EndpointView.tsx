import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCreateEndpoint } from '../hooks/useCreateEndpoint'
import { useDeleteAllRequests } from '../hooks/useDeleteAllRequests'
import { useDeleteRequest } from '../hooks/useDeleteRequest'
import { useRequests } from '../hooks/useRequests'
import { useWebSocket } from '../hooks/useWebSocket'
import { clearStoredSlug, writeStoredSlug } from '../lib/endpoint'
import { ConnectionStatus } from './ConnectionStatus'
import { DetailPanel } from './DetailPanel'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function EndpointView() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const mutation = useCreateEndpoint()
  const { data: requests, isLoading, isError } = useRequests(slug)
  const deleteMutation = useDeleteRequest(slug)
  const deleteAllMutation = useDeleteAllRequests(slug)
  const list = requests ?? []
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  // Snapshot of `list.length` at pin time so the "N new" badge counts only
  // requests that arrived after pinning, not pre-existing items above the pin.
  const [pinnedAtLength, setPinnedAtLength] = useState(0)
  const { status: wsStatus } = useWebSocket(slug)

  // Keep localStorage in sync with the currently viewed endpoint so reloads
  // land on the last viewed slug.
  useEffect(() => {
    if (slug) writeStoredSlug(slug)
  }, [slug])

  // Drop a stale pin if the pinned request leaves the list (e.g. slug change
  // or test-driven cache swap). Auto-follow is otherwise derived from `list`.
  useEffect(() => {
    if (pinnedId === null) return
    if (!list.some((r) => r.id === pinnedId)) {
      setPinnedId(null)
      setPinnedAtLength(0)
    }
  }, [list, pinnedId])

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

  const handlePin = (id: string) => {
    setPinnedId(id)
    setPinnedAtLength(list.length)
  }

  const handleJumpToLatest = () => {
    setPinnedId(null)
    setPinnedAtLength(0)
  }

  const handleDelete = (id: string) => deleteMutation.mutate(id)
  const handleClearAll = () => deleteAllMutation.mutate()

  const pinnedIndex = pinnedId === null ? -1 : list.findIndex((r) => r.id === pinnedId)
  const newCount = pinnedId !== null ? Math.max(0, list.length - pinnedAtLength) : 0
  const pinnedRequest = pinnedIndex >= 0 ? list[pinnedIndex] : undefined
  const displayedRequest = pinnedRequest ?? list[0] ?? null
  const displayedId = displayedRequest?.id ?? null
  const displayedIndex = pinnedIndex >= 0 ? pinnedIndex : 0
  const previousRequest = list[displayedIndex + 1] ?? null

  return (
    <>
      <Header url={url} slug={slug} onNewEndpoint={handleNewEndpoint} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          requests={list}
          isLoading={isLoading}
          isError={isError}
          selectedId={displayedId}
          onSelect={handlePin}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
          newCount={newCount}
          onJumpToLatest={handleJumpToLatest}
        />
        <DetailPanel
          key={displayedId}
          request={displayedRequest}
          previousRequest={previousRequest}
        />
      </div>
      <ConnectionStatus status={wsStatus} />
    </>
  )
}
