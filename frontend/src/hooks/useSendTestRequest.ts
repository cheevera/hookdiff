import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sendTestRequest } from '../lib/api'

export function useSendTestRequest(slug: string | undefined) {
  return useMutation({
    mutationFn: () => sendTestRequest(slug as string),
    onSuccess: () => toast.success('Test request sent'),
    onError: () => toast.error('Failed to send test request'),
  })
}
