import { useMutation } from '@tanstack/react-query'
import { createEndpoint } from '../lib/api'
import { writeStoredSlug } from '../lib/endpoint'

export function useCreateEndpoint() {
  return useMutation({
    mutationFn: createEndpoint,
    onSuccess: (endpoint) => writeStoredSlug(endpoint.slug),
  })
}
