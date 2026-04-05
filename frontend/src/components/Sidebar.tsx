import type { WebhookRequest } from '../types/request'
import { MethodBadge } from './MethodBadge'

function bodyPreview(body: unknown): string {
  if (body === null || body === undefined) return '(no body)'
  try {
    return JSON.stringify(body)
  } catch {
    return String(body)
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString()
}

type SidebarItemProps = {
  request: WebhookRequest
  selected: boolean
  onSelect: () => void
}

function SidebarItem({ request, selected, onSelect }: SidebarItemProps) {
  return (
    <li className="border-b border-gray-200 dark:border-gray-800">
      <button
        type="button"
        onClick={onSelect}
        data-selected={selected}
        className={`block w-full px-4 py-3 text-left ${
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
      </button>
    </li>
  )
}

type SidebarProps = {
  requests: WebhookRequest[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function Sidebar({ requests, selectedId, onSelect }: SidebarProps) {
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <ul>
        {requests.map((request) => (
          <SidebarItem
            key={request.id}
            request={request}
            selected={request.id === selectedId}
            onSelect={() => onSelect(request.id)}
          />
        ))}
      </ul>
    </aside>
  )
}
