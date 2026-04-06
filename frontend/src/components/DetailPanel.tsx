import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import type { WebhookRequest } from '../types/request'
import { DiffView } from './DiffView'
import { JsonCode } from './JsonCode'
import { MethodBadge } from './MethodBadge'

function KeyValueList({ entries }: { entries: Record<string, string> }) {
  return (
    <dl className="mt-2 rounded border border-gray-200 bg-gray-50 font-mono text-xs dark:border-gray-800 dark:bg-gray-900">
      {Object.entries(entries).map(([key, value]) => (
        <div
          key={key}
          className="flex gap-2 border-b border-gray-200 px-3 py-1.5 last:border-b-0 dark:border-gray-800"
        >
          <dt className="font-bold text-gray-500 dark:text-gray-400">{key}</dt>
          <dd className="text-gray-700 dark:text-gray-300">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

type ViewMode = 'detail' | 'diff'

export function DetailPanel({
  request,
  previousRequest = null,
}: {
  request: WebhookRequest | null
  previousRequest?: WebhookRequest | null
}) {
  const { theme } = useTheme()
  const [showHeaders, setShowHeaders] = useState(false)
  const [showQueryParams, setShowQueryParams] = useState(false)
  const [view, setView] = useState<ViewMode>('diff')

  if (!request) {
    return (
      <section className="flex-1 bg-white p-6 text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">
        No request selected
      </section>
    )
  }

  const effectiveView = previousRequest ? view : 'detail'
  const diffEnabled = previousRequest !== null
  const headerCount = Object.keys(request.headers).length
  const queryParamCount = Object.keys(request.queryParams).length

  const activeButtonClass =
    'border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
  const inactiveButtonClass =
    'border border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900'
  const disabledButtonClass =
    'border border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 opacity-50 cursor-not-allowed dark:border-gray-700 dark:text-gray-400'

  return (
    <section className="flex flex-1 flex-col overflow-y-auto bg-white p-6 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <MethodBadge method={request.method} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(request.receivedAt).toLocaleString()}
        </span>
      </div>

      <div className="mt-3 flex">
        <button
          type="button"
          onClick={() => setView('detail')}
          className={`rounded-l-full border-l ${effectiveView === 'detail' ? activeButtonClass : inactiveButtonClass}`}
        >
          Detail
        </button>
        {diffEnabled ? (
          <button
            type="button"
            onClick={() => setView('diff')}
            className={`rounded-r-full border-l-0 ${effectiveView === 'diff' ? activeButtonClass : inactiveButtonClass}`}
          >
            Diff
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="Available when comparing requests"
            className={`rounded-r-full border-l-0 ${disabledButtonClass}`}
          >
            Diff
          </button>
        )}
      </div>

      {effectiveView === 'diff' && previousRequest ? (
        <DiffView current={request} previous={previousRequest} />
      ) : (
        <>
          {headerCount > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowHeaders(!showHeaders)}
                className="text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Headers ({headerCount})
              </button>
              {showHeaders && <KeyValueList entries={request.headers} />}
            </div>
          )}

          {queryParamCount > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowQueryParams(!showQueryParams)}
                className="text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Query params ({queryParamCount})
              </button>
              {showQueryParams && <KeyValueList entries={request.queryParams} />}
            </div>
          )}

          <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Body
          </h2>
          <JsonCode value={request.body} theme={theme} />
        </>
      )}
    </section>
  )
}
