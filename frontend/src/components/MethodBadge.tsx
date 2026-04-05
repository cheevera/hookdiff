import type { HttpMethod } from '../types/request'

const METHOD_CLASSES: Record<HttpMethod, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
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
