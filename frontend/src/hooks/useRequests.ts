import { useQuery } from '@tanstack/react-query'
import { fetchRequests } from '../lib/api'

export function useRequests(slug: string | undefined) {
  return useQuery({
    queryKey: ['requests', slug],
    queryFn: () => fetchRequests(slug as string),
    enabled: !!slug,
  })
}
