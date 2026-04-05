import { HARDCODED_REQUESTS } from '../fixtures/requests'
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

function SidebarItem({ request }: { request: WebhookRequest }) {
  return (
    <li className="border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <MethodBadge method={request.method} />
        <span className="text-xs text-gray-500">{formatTime(request.receivedAt)}</span>
      </div>
      <div className="mt-1 truncate font-mono text-xs text-gray-600">
        {bodyPreview(request.body)}
      </div>
    </li>
  )
}

export function Sidebar() {
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-r border-gray-200">
      <ul>
        {HARDCODED_REQUESTS.map((request) => (
          <SidebarItem key={request.id} request={request} />
        ))}
      </ul>
    </aside>
  )
}
