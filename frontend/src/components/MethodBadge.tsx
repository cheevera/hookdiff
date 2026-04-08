import type { HttpMethod } from '@/types/request'

const METHOD_CLASSES: Record<HttpMethod, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${METHOD_CLASSES[method]}`}
    >
      {method}
    </span>
  )
}
