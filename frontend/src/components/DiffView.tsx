import { JsonCode } from '@/components/JsonCode'
import { useTheme } from '@/hooks/useTheme'
import { type DiffEntry, diff } from '@/lib/diff'
import { isPlainObject } from '@/lib/object'
import type { WebhookRequest } from '@/types/request'

function formatValue(value: unknown): string {
  return JSON.stringify(value)
}

const TYPE_STYLES: Record<DiffEntry['type'], string> = {
  changed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  added: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  removed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

function DiffEntryRow({ entry }: { entry: DiffEntry }) {
  return (
    <div className="flex items-start gap-2 border-b border-gray-200 px-3 py-2 last:border-b-0 dark:border-gray-800">
      <code className="shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
        {entry.path}
      </code>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLES[entry.type]}`}
      >
        {entry.type}
      </span>
      <span className="min-w-0 break-all font-mono text-xs text-gray-600 dark:text-gray-400">
        {entry.type === 'added' && formatValue(entry.newValue)}
        {entry.type === 'removed' && formatValue(entry.oldValue)}
        {entry.type === 'changed' && (
          <>
            <span className="text-red-600 dark:text-red-400">{formatValue(entry.oldValue)}</span>
            {' \u2192 '}
            <span className="text-green-600 dark:text-green-400">
              {formatValue(entry.newValue)}
            </span>
          </>
        )}
      </span>
    </div>
  )
}

export function DiffView({
  current,
  previous,
}: {
  current: WebhookRequest
  previous: WebhookRequest
}) {
  const { theme } = useTheme()

  const bothPlainObjects = isPlainObject(current.body) && isPlainObject(previous.body)
  const entries: DiffEntry[] = bothPlainObjects
    ? diff(previous.body as Record<string, unknown>, current.body as Record<string, unknown>)
    : JSON.stringify(previous.body) !== JSON.stringify(current.body)
      ? [
          {
            path: '(body)',
            type: 'changed',
            oldValue: previous.body,
            newValue: current.body,
          },
        ]
      : []

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="rounded border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        {entries.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">No differences</p>
        ) : (
          entries.map((entry) => <DiffEntryRow key={entry.path} entry={entry} />)
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Previous
          </h3>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {new Date(previous.receivedAt).toLocaleString()}
          </span>
          <JsonCode value={previous.body} theme={theme} />
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Current
          </h3>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {new Date(current.receivedAt).toLocaleString()}
          </span>
          <JsonCode value={current.body} theme={theme} />
        </div>
      </div>
    </div>
  )
}
