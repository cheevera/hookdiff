import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAllRequests } from '../lib/requests'
import type { WebhookRequest } from '../types/request'

export function useDeleteAllRequests(slug: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteAllRequests(slug as string),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['requests', slug] })
      const previous = queryClient.getQueryData<WebhookRequest[]>(['requests', slug])
      queryClient.setQueryData<WebhookRequest[]>(['requests', slug], [])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['requests', slug], context.previous)
      }
    },
  })
}
