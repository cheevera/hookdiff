import { HARDCODED_REQUESTS } from '../fixtures/requests'
import { MethodBadge } from './MethodBadge'

export function DetailPanel() {
  const request = HARDCODED_REQUESTS[0]
  if (!request) {
    return (
      <section className="flex-1 p-6 text-sm text-gray-500 dark:text-gray-400">
        No request selected
      </section>
    )
  }
  return (
    <section className="flex flex-1 flex-col overflow-y-auto bg-white p-6 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <MethodBadge method={request.method} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{request.receivedAt}</span>
      </div>
      <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Body
      </h2>
      <pre className="mt-2 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
        {JSON.stringify(request.body, null, 2)}
      </pre>
    </section>
  )
}
