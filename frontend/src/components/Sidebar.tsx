import type { WebhookRequest } from '../types/request'
import { MethodBadge } from './MethodBadge'

const PREVIEW_MAX_LEN = 80

function bodyPreview(body: unknown): string {
  if (body === null || body === undefined) return '(no body)'
  let text: string
  try {
    text = JSON.stringify(body)
  } catch {
    text = String(body)
  }
  if (text.length > PREVIEW_MAX_LEN) {
    return `${text.slice(0, PREVIEW_MAX_LEN)}…`
  }
  return text
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString()
}

function latestReceivedAt(requests: WebhookRequest[]): string {
  let latest = requests[0].receivedAt
  for (const r of requests) {
    if (new Date(r.receivedAt).getTime() > new Date(latest).getTime()) {
      latest = r.receivedAt
    }
  }
  return latest
}

type SidebarItemProps = {
  request: WebhookRequest
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}

function SidebarItem({ request, selected, onSelect, onDelete }: SidebarItemProps) {
  return (
    <li className="border-b border-gray-200 dark:border-gray-800">
      {/* biome-ignore lint/a11y/useSemanticElements: div with role=button avoids invalid nested button elements */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
        data-selected={selected}
        className={`relative block w-full px-4 py-3 text-left ${
          selected ? 'bg-gray-100 dark:bg-gray-800' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <MethodBadge method={request.method} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(request.receivedAt)}
          </span>
        </div>
        <div className="mt-1 truncate font-mono text-xs text-gray-600 dark:text-gray-400">
          {bodyPreview(request.body)}
        </div>
        <button
          type="button"
          aria-label="Delete request"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </li>
  )
}

type SidebarProps = {
  requests: WebhookRequest[]
  isLoading: boolean
  isError: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  newCount: number
  onJumpToLatest: () => void
}

const shellClass =
  'w-80 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'

export function Sidebar({
  requests,
  isLoading,
  isError,
  selectedId,
  onSelect,
  onDelete,
  onClearAll,
  newCount,
  onJumpToLatest,
}: SidebarProps) {
  if (isLoading) {
    return (
      <aside className={shellClass}>
        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading requests…
        </div>
      </aside>
    )
  }
  if (isError) {
    return (
      <aside className={shellClass}>
        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Failed to load requests
        </div>
      </aside>
    )
  }
  if (requests.length === 0) {
    return (
      <aside className={shellClass}>
        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No requests yet
        </div>
      </aside>
    )
  }

  const handleClearAll = () => {
    if (window.confirm('Delete all requests?')) {
      onClearAll()
    }
  }

  return (
    <aside className={shellClass}>
      {newCount > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
          <span>
            {newCount} new request{newCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={onJumpToLatest}
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Jump to latest
          </button>
        </div>
      )}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
        <div>
          <div>{requests.length} requests</div>
          <div>Last: {formatTime(latestReceivedAt(requests))}</div>
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Clear all
        </button>
      </div>
      <ul>
        {requests.map((request) => (
          <SidebarItem
            key={request.id}
            request={request}
            selected={request.id === selectedId}
            onSelect={() => onSelect(request.id)}
            onDelete={() => onDelete(request.id)}
          />
        ))}
      </ul>
    </aside>
  )
}
