import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useCreateEndpoint } from '../hooks/useCreateEndpoint'
import { readStoredSlug } from '../lib/endpoint'

export function EndpointBootstrap() {
  const navigate = useNavigate()
  const mutation = useCreateEndpoint()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    const stored = readStoredSlug()
    if (stored) {
      fired.current = true
      navigate(`/${stored}`, { replace: true })
      return
    }
    fired.current = true
    mutation.mutate(undefined, {
      onSuccess: (endpoint) => navigate(`/${endpoint.slug}`, { replace: true }),
    })
  }, [navigate, mutation])

  if (mutation.isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <p>Failed to create endpoint.</p>
          <button
            type="button"
            onClick={() => {
              mutation.reset()
              fired.current = false
              mutation.mutate(undefined, {
                onSuccess: (endpoint) => navigate(`/${endpoint.slug}`, { replace: true }),
              })
            }}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-gray-500 dark:text-gray-400">
      Creating endpoint…
    </div>
  )
}
