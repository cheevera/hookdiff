import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteRequest } from '../lib/api'
import type { WebhookRequest } from '../types/request'

export function useDeleteRequest(slug: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRequest(slug as string, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['requests', slug] })
      const previous = queryClient.getQueryData<WebhookRequest[]>(['requests', slug])
      queryClient.setQueryData<WebhookRequest[]>(['requests', slug], (old) =>
        old ? old.filter((r) => r.id !== id) : [],
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['requests', slug], context.previous)
      }
      toast.error('Failed to delete request')
    },
  })
}
