import { useMutation } from '@tanstack/react-query'
import { createEndpoint, writeStoredSlug } from '../lib/endpoint'

export function useCreateEndpoint() {
  return useMutation({
    mutationFn: createEndpoint,
    onSuccess: (endpoint) => writeStoredSlug(endpoint.slug),
  })
}
